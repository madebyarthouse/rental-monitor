import { and, avg, count, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { BaseService } from "./base";
import { listings } from "@/db/schema";
import type { RegionContext } from "./listings-service";

export type StatisticsFilters = {
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  limited?: boolean;
  unlimited?: boolean;
  rooms?: number;
  platforms?: string[];
};

export type StatisticsSummary = {
  total: number;
  limitedCount: number;
  limitedPct: number | null;
  activeCount: number;
  avgPrice: number | null;
  avgArea: number | null;
  avgPricePerSqm: number | null;
};

export class StatisticsService extends BaseService {
  constructor(d1Database: D1Database) {
    super(d1Database);
  }

  private buildRegionWhere(region: RegionContext) {
    if (region.level === "district") {
      return eq(listings.regionId, region.districtId);
    }
    if (region.level === "state") {
      if (!region.districtIds.length) return undefined;
      return inArray(listings.regionId, region.districtIds);
    }
    // Country level: no region filtering, fetch all
    return undefined;
  }

  private buildFilterWhere(filters: StatisticsFilters) {
    const conditions: any[] = [];
    if (filters.minPrice != null)
      conditions.push(gte(listings.price, filters.minPrice));
    if (filters.maxPrice != null)
      conditions.push(lte(listings.price, filters.maxPrice));
    if (filters.minArea != null)
      conditions.push(gte(listings.area, filters.minArea));
    if (filters.maxArea != null)
      conditions.push(lte(listings.area, filters.maxArea));
    if (filters.rooms != null)
      conditions.push(eq(listings.rooms, filters.rooms));

    if (filters.limited && !filters.unlimited)
      conditions.push(eq(listings.isLimited, true));
    if (filters.unlimited && !filters.limited)
      conditions.push(eq(listings.isLimited, false));

    if (filters.platforms && filters.platforms.length) {
      conditions.push(inArray(listings.platform, filters.platforms));
    }

    if (!conditions.length) return undefined as any;
    return and(...conditions);
  }

  async getStatistics(
    region: RegionContext,
    filters: StatisticsFilters
  ): Promise<StatisticsSummary> {
    const regionWhere = this.buildRegionWhere(region);
    const filterWhere = this.buildFilterWhere(filters);
    const whereExpr =
      regionWhere && filterWhere
        ? and(regionWhere, filterWhere)
        : regionWhere || filterWhere;

    const pricePerSqmExpr = sql<number>`CASE WHEN ${listings.area} IS NOT NULL AND ${listings.area} > 0 THEN ${listings.price} / ${listings.area} ELSE NULL END`;
    const limitedExpr = sql<number>`CASE WHEN ${listings.isLimited} THEN 1 ELSE 0 END`;

    const rows = await this.db
      .select({
        total: count(listings.id),
        limitedCount: sql<number>`SUM(${limitedExpr})`,
        activeCount: sql<number>`SUM(CASE WHEN ${listings.isActive} THEN 1 ELSE 0 END)`,
        avgPrice: avg(listings.price),
        avgArea: avg(listings.area),
        avgPricePerSqm: avg(pricePerSqmExpr),
      })
      .from(listings)
      .where(whereExpr as any)
      .limit(1);

    const r = rows[0];
    const total = r?.total ?? 0;
    const limitedCount = r?.limitedCount ?? 0;
    const limitedPct =
      total > 0 ? Math.round((limitedCount / total) * 1000) / 10 : null;

    return {
      total,
      limitedCount,
      activeCount: rows[0]?.activeCount ?? 0,
      limitedPct,
      avgPrice: r?.avgPrice ?? null,
      avgArea: r?.avgArea ?? null,
      avgPricePerSqm: r?.avgPricePerSqm ?? null,
    };
  }

  async getLimitedCounts(
    region: RegionContext,
    filters: StatisticsFilters
  ): Promise<{ limited: number; unlimited: number; total: number }> {
    const regionWhere = this.buildRegionWhere(region);
    const filterWhere = this.buildFilterWhere(filters);
    const whereExpr =
      regionWhere && filterWhere
        ? and(regionWhere, filterWhere)
        : regionWhere || filterWhere;

    const limitedExpr = sql<number>`CASE WHEN ${listings.isLimited} THEN 1 ELSE 0 END`;
    const rows = await this.db
      .select({
        total: count(listings.id),
        limited: sql<number>`SUM(${limitedExpr})`,
      })
      .from(listings)
      .where(whereExpr as any)
      .limit(1);

    const total = rows[0]?.total ?? 0;
    const limited = rows[0]?.limited ?? 0;
    const unlimited = Math.max(0, total - limited);
    return { limited, unlimited, total };
  }

  async getPriceHistogram(
    region: RegionContext,
    filters: StatisticsFilters
  ): Promise<{
    buckets: Array<{ start: number; end: number | null; count: number }>;
    range: { min: number | null; max: number | null };
  }> {
    const regionWhere = this.buildRegionWhere(region);
    const filterWhere = this.buildFilterWhere(filters);
    const whereExpr =
      regionWhere && filterWhere
        ? and(regionWhere, filterWhere)
        : regionWhere || filterWhere;

    // Fixed buckets (EUR): [0,500), [500,1000), [1000,1500), [1500,2000), [2000,2500), [2500, +inf)
    const row = await this.db
      .select({
        b0: sql<number>`SUM(CASE WHEN ${listings.price} >= 0 AND ${listings.price} < 500 THEN 1 ELSE 0 END)` as any,
        b1: sql<number>`SUM(CASE WHEN ${listings.price} >= 500 AND ${listings.price} < 1000 THEN 1 ELSE 0 END)` as any,
        b2: sql<number>`SUM(CASE WHEN ${listings.price} >= 1000 AND ${listings.price} < 1500 THEN 1 ELSE 0 END)` as any,
        b3: sql<number>`SUM(CASE WHEN ${listings.price} >= 1500 AND ${listings.price} < 2000 THEN 1 ELSE 0 END)` as any,
        b4: sql<number>`SUM(CASE WHEN ${listings.price} >= 2000 AND ${listings.price} < 2500 THEN 1 ELSE 0 END)` as any,
        b5: sql<number>`SUM(CASE WHEN ${listings.price} >= 2500 THEN 1 ELSE 0 END)` as any,
        min: sql<number>`MIN(${listings.price})`,
        max: sql<number>`MAX(${listings.price})`,
      })
      .from(listings)
      .where(whereExpr as any)
      .limit(1);

    const r = row[0] as any;
    const buckets = [
      { start: 0, end: 500, count: (r?.b0 as number) ?? 0 },
      { start: 500, end: 1000, count: (r?.b1 as number) ?? 0 },
      { start: 1000, end: 1500, count: (r?.b2 as number) ?? 0 },
      { start: 1500, end: 2000, count: (r?.b3 as number) ?? 0 },
      { start: 2000, end: 2500, count: (r?.b4 as number) ?? 0 },
      { start: 2500, end: null, count: (r?.b5 as number) ?? 0 },
    ];

    return { buckets, range: { min: r?.min ?? null, max: r?.max ?? null } };
  }
}
