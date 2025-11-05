import { desc, eq } from "drizzle-orm";
import { BaseService } from "./base";
import { listings, regions } from "@/db/schema";

export type ExportRow = {
  title: string;
  price: number;
  area: number | null;
  rooms: number | null;
  zipCode: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  isLimited: boolean;
  durationMonths: number | null;
  platform: string;
  url: string;
  externalId: string | null;
  lastSeenAt: string; // ISO string (UTC)
  regionName: string | null;
};

function toIsoUTC(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  const num = typeof value === "string" ? Number(value) : (value as number);
  if (typeof num === "number" && Number.isFinite(num)) {
    const ms = num < 1e12 ? num * 1000 : num;
    return new Date(ms).toISOString();
  }
  const parsed = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

export class ExportService extends BaseService {
  constructor(d1Database: D1Database) {
    super(d1Database);
  }

  async getActiveListingsWithRegionForExport(): Promise<ExportRow[]> {
    const rows = await this.db
      .select({
        title: listings.title,
        price: listings.price,
        area: listings.area,
        rooms: listings.rooms,
        zipCode: listings.zipCode,
        city: listings.city,
        district: listings.district,
        state: listings.state,
        isLimited: listings.isLimited,
        durationMonths: listings.durationMonths,
        platform: listings.platform,
        url: listings.url,
        externalId: listings.externalId,
        lastSeenAt: listings.lastSeenAt,
        regionName: regions.name,
      })
      .from(listings)
      .leftJoin(regions, eq(regions.id, listings.regionId))
      .where(eq(listings.isActive, true))
      .orderBy(desc(listings.lastSeenAt));

    return rows.map((r) => ({
      title: r.title,
      price: r.price,
      area: r.area ?? null,
      rooms: r.rooms ?? null,
      zipCode: r.zipCode ?? null,
      city: r.city ?? null,
      district: r.district ?? null,
      state: r.state ?? null,
      isLimited: Boolean(r.isLimited),
      durationMonths: r.durationMonths ?? null,
      platform: r.platform,
      url: r.url,
      externalId: r.externalId ?? null,
      lastSeenAt: toIsoUTC(r.lastSeenAt),
      regionName: (r as any).regionName ?? null,
    }));
  }
}
