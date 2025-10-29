import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { BaseService } from "./base";
import { listings } from "@/db/schema";

export type RegionContext =
  | { level: "country"; districtIds?: number[] }
  | {
      level: "state";
      districtIds: number[];
      districtNames?: string[];
      stateName?: string;
    }
  | { level: "district"; districtId: number; districtName?: string };

export type ListingsFilters = {
  page: number;
  perPage: number;
  sortBy: "price" | "area" | "pricePerSqm" | "lastSeenAt";
  order: "asc" | "desc";
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  limited?: boolean;
  unlimited?: boolean;
  rooms?: number;
  platforms?: string[];
};

export type ListingItem = {
  id: number;
  title: string;
  price: number;
  area: number | null;
  rooms: number | null;
  isLimited: boolean;
  platform: string;
  url: string;
  lastSeenAt: Date;
  regionId: number | null;
};

export type ListingsResult = {
  items: ListingItem[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export class ListingsService extends BaseService {
  constructor(d1Database: D1Database) {
    super(d1Database);
  }

  private buildRegionWhere(region: RegionContext) {
    if (region.level === "district") {
      const byId = eq(listings.regionId, region.districtId);
      if (region.districtName && region.districtName.length > 0) {
        return or(byId, eq(listings.district, region.districtName));
      }
      return byId;
    }
    if (region.level === "state") {
      const parts: any[] = [];
      if (region.districtIds && region.districtIds.length) {
        parts.push(inArray(listings.regionId, region.districtIds));
      }
      if (region.districtNames && region.districtNames.length) {
        parts.push(inArray(listings.district, region.districtNames));
      }
      if (region.stateName && region.stateName.length > 0) {
        parts.push(eq(listings.state, region.stateName));
      }
      if (!parts.length) return undefined;
      // Combine with OR to allow fallback while regionId is not populated
      return parts.length === 1
        ? (parts[0] as any)
        : (or(...(parts as any)) as any);
    }
    // Country level: no region filtering, fetch all
    return undefined;
  }

  private buildFilterWhere(filters: ListingsFilters) {
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

    // limited vs unlimited tri-state
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

  private buildOrderBy(filters: ListingsFilters) {
    const direction = filters.order === "asc" ? asc : desc;

    switch (filters.sortBy) {
      case "price":
        return [direction(listings.price)];
      case "area":
        return [direction(listings.area)];
      case "pricePerSqm": {
        const pricePerSqm = sql<number>`CASE WHEN ${listings.area} IS NOT NULL AND ${listings.area} > 0 THEN ${listings.price} / ${listings.area} ELSE NULL END`;
        return [direction(pricePerSqm.nullsLast())];
      }
      case "lastSeenAt":
      default:
        return [direction(listings.lastSeenAt)];
    }
  }

  async getListings(
    region: RegionContext,
    filters: ListingsFilters
  ): Promise<ListingsResult> {
    const regionWhere = this.buildRegionWhere(region);
    const filterWhere = this.buildFilterWhere(filters);

    const whereExpr =
      regionWhere && filterWhere
        ? and(regionWhere, filterWhere)
        : regionWhere || filterWhere;

    const orderBy = this.buildOrderBy(filters);
    const limit = filters.perPage;
    const offset = (filters.page - 1) * filters.perPage;

    const rows = await this.db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        area: listings.area,
        rooms: listings.rooms,
        isLimited: listings.isLimited,
        platform: listings.platform,
        url: listings.url,
        lastSeenAt: listings.lastSeenAt,
        regionId: listings.regionId,
      })
      .from(listings)
      .where(whereExpr as any)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const totalRow = await this.db
      .select({ total: count(listings.id).as("c") })
      .from(listings)
      .where(whereExpr as any)
      .limit(1);

    const total = totalRow[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / filters.perPage));

    function toDate(value: unknown): Date {
      if (value instanceof Date) return value;
      const num = typeof value === "string" ? Number(value) : (value as number);
      if (typeof num === "number" && Number.isFinite(num)) {
        const ms = num < 1e12 ? num * 1000 : num;
        return new Date(ms);
      }
      const parsed = typeof value === "string" ? Date.parse(value) : NaN;
      return Number.isFinite(parsed) ? new Date(parsed) : new Date(0);
    }

    return {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        price: r.price,
        area: r.area,
        rooms: r.rooms,
        isLimited: r.isLimited,
        platform: r.platform,
        url: r.url,
        lastSeenAt: toDate(r.lastSeenAt),
        regionId: r.regionId,
      })),
      page: filters.page,
      perPage: filters.perPage,
      total,
      totalPages,
    };
  }
}
