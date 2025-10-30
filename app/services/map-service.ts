import { and, avg, count, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { BaseService } from "./base";
import { listings, regions } from "@/db/schema";
import type { RegionContext } from "./listings-service";

export type MapFilters = {
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  limited?: boolean;
  unlimited?: boolean;
  platforms?: string[];
};

export type HeatmapMetric =
  | "limitedPercentage"
  | "avgPricePerSqm"
  | "totalListings";

export type HeatmapValue = { slug: string; value: number | null };
export type HeatmapResult = {
  byRegion: HeatmapValue[];
  range: { min: number | null; max: number | null; avg: number | null };
  metric: HeatmapMetric;
};

export class MapService extends BaseService {
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
    // Country level: aggregate across all regions; don't restrict by IDs
    if (region.level === "country") return undefined;
    return undefined;
  }

  private buildFilterWhere(filters: MapFilters) {
    const conditions: any[] = [];
    if (filters.minPrice != null)
      conditions.push(gte(listings.price, filters.minPrice));
    if (filters.maxPrice != null)
      conditions.push(lte(listings.price, filters.maxPrice));
    if (filters.minArea != null)
      conditions.push(gte(listings.area, filters.minArea));
    if (filters.maxArea != null)
      conditions.push(lte(listings.area, filters.maxArea));
    if (filters.limited && !filters.unlimited)
      conditions.push(eq(listings.isLimited, true));
    if (filters.unlimited && !filters.limited)
      conditions.push(eq(listings.isLimited, false));
    if (filters.platforms && filters.platforms.length)
      conditions.push(inArray(listings.platform, filters.platforms));
    if (!conditions.length) return undefined as any;
    return and(...conditions);
  }

  async getHeatmapData(
    region: RegionContext,
    metric: HeatmapMetric,
    filters: MapFilters,
    visibleDistrictIds?: number[]
  ): Promise<HeatmapResult> {
    // Country: do not limit groups; State: use districts; District: single id
    const groupIds =
      region.level === "district"
        ? [region.districtId]
        : region.level === "state"
        ? region.districtIds
        : undefined;

    const regionWhere = this.buildRegionWhere({
      level: region.level,
      // For country level, optionally narrow to visible districts
      ...(region.level === "district"
        ? { districtId: region.districtId }
        : { districtIds: groupIds }),
    } as RegionContext);
    const filterWhere = this.buildFilterWhere(filters);
    const whereExpr =
      regionWhere && filterWhere
        ? and(regionWhere, filterWhere)
        : regionWhere || filterWhere;

    const pricePerSqmExpr = sql<number>`CASE WHEN ${listings.area} IS NOT NULL AND ${listings.area} > 0 THEN ${listings.price} / ${listings.area} ELSE NULL END`;
    const limitedExpr = sql<number>`CASE WHEN ${listings.isLimited} THEN 1 ELSE 0 END`;

    // Build metric-specific aggregate expression
    const metricExpr =
      metric === "totalListings"
        ? count(listings.id)
        : metric === "avgPricePerSqm"
        ? avg(pricePerSqmExpr)
        : sql<number>`CASE WHEN COUNT(${listings.id}) > 0 THEN (SUM(${limitedExpr}) * 100.0) / COUNT(${listings.id}) ELSE NULL END`;

    const rows = await this.db
      .select({
        regionId: listings.regionId,
        value: metricExpr,
      })
      .from(listings)
      .where(whereExpr as any)
      .groupBy(listings.regionId);

    if (!rows.length) {
      return {
        byRegion: [],
        range: { min: null, max: null, avg: null },
        metric,
      };
    }

    // Join to regions to resolve slugs for districts
    const ids = rows
      .map((r) => r.regionId)
      .filter((x): x is number => x != null);

    // Batch region lookups to avoid exceeding SQL parameter limits (typically 100 for D1)
    const regionRows: Array<{ id: number; slug: string }> = [];
    const batchSize = 99;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const batchRows = await this.db
        .select({ id: regions.id, slug: regions.slug })
        .from(regions)
        .where(inArray(regions.id, batch));
      regionRows.push(...batchRows);
    }

    const idToSlug = new Map(regionRows.map((r) => [r.id, r.slug] as const));

    const values = rows
      .map((r) => ({
        slug:
          r.regionId != null
            ? idToSlug.get(r.regionId) ?? String(r.regionId)
            : "",
        value:
          r.value == null
            ? null
            : typeof r.value === "number"
            ? (r.value as number)
            : Number(r.value),
      }))
      .filter((v) => v.slug !== "");

    const numeric = values
      .map((v) => (v.value == null ? null : Number(v.value)))
      .filter((v): v is number => v != null && Number.isFinite(v));

    const min = numeric.length ? Math.min(...numeric) : null;
    const max = numeric.length ? Math.max(...numeric) : null;
    const avgVal = numeric.length
      ? numeric.reduce((a, b) => a + b, 0) / numeric.length
      : null;

    return {
      byRegion: values,
      range: { min, max, avg: avgVal },
      metric,
    };
  }
}
