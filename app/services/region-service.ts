import { eq, and, asc, sql } from "drizzle-orm";
import { BaseService } from "./base";
import { regions } from "@/db/schema";
import { alias } from "drizzle-orm/sqlite-core";

type BoundsTuple = [[number, number], [number, number]];
type BoundsObject = {
  north: number;
  south: number;
  east: number;
  west: number;
};
export type RegionDTO = {
  id: number;
  name: string;
  slug: string;
  geojson?: unknown;
  bounds?: BoundsTuple;
};

type Region = typeof regions.$inferSelect;
export type RegionHierarchy = Array<{
  state: Region;
  districts: Region[];
}>;

export type DistrictWithStateDTO = {
  id: number;
  name: string;
  slug: string;
  stateSlug: string;
  geojson?: unknown;
};

export class RegionService extends BaseService {
  constructor(d1Database: D1Database) {
    super(d1Database);
  }

  private parseJsonColumn<T>(value: unknown): T | undefined {
    if (value == null) return undefined;
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as T;
      } catch {
        return undefined;
      }
    }
    return value as T;
  }

  private isBoundsTuple(value: unknown): value is BoundsTuple {
    if (!Array.isArray(value) || value.length !== 2) return false;
    const [min, max] = value;
    if (!Array.isArray(min) || !Array.isArray(max)) return false;
    if (min.length !== 2 || max.length !== 2) return false;
    const [minLng, minLat] = min;
    const [maxLng, maxLat] = max;
    return (
      typeof minLng === "number" &&
      typeof minLat === "number" &&
      typeof maxLng === "number" &&
      typeof maxLat === "number" &&
      Number.isFinite(minLng) &&
      Number.isFinite(minLat) &&
      Number.isFinite(maxLng) &&
      Number.isFinite(maxLat)
    );
  }

  private isBoundsObject(value: unknown): value is BoundsObject {
    if (typeof value !== "object" || value == null) return false;
    const v = value as Record<string, unknown>;
    return (
      typeof v.north === "number" &&
      typeof v.south === "number" &&
      typeof v.east === "number" &&
      typeof v.west === "number" &&
      Number.isFinite(v.north) &&
      Number.isFinite(v.south) &&
      Number.isFinite(v.east) &&
      Number.isFinite(v.west)
    );
  }

  private normalizeBounds(raw: unknown): BoundsTuple | undefined {
    const parsed = this.parseJsonColumn<unknown>(raw);
    if (parsed == null) return undefined;

    if (this.isBoundsTuple(parsed)) {
      return parsed;
    }

    if (this.isBoundsObject(parsed)) {
      // Convert { west, south, east, north } -> [[south, west], [north, east]] (Leaflet expects [lat, lng])
      return [
        [parsed.south, parsed.west],
        [parsed.north, parsed.east],
      ];
    }

    return undefined;
  }

  private mapRegionToDTO(r: Region): RegionDTO {
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      geojson: this.parseJsonColumn<unknown>(r.geojson),
      bounds: this.normalizeBounds(r.bounds),
    };
  }

  async getRegions() {
    return this.db.query.regions.findMany();
  }

  async getAllStates() {
    return this.db.query.regions.findMany({
      where: eq(regions.type, "state"),
      orderBy: asc(regions.name),
    });
  }

  async getRegionBySlug(slug: string) {
    return this.db.query.regions.findFirst({
      where: eq(regions.slug, slug),
    });
  }

  async getDistrictsByStateId(stateId: number) {
    return this.db.query.regions.findMany({
      where: and(
        eq(regions.parentId, stateId.toString()),
        eq(regions.type, "district")
      ),
      orderBy: asc(regions.name),
    });
  }

  async getStateWithDistricts(
    stateSlug: string
  ): Promise<{ state: RegionDTO; districts: RegionDTO[] } | null> {
    const state = await this.getRegionBySlug(stateSlug);
    if (!state) return null;
    const districts = await this.getDistrictsByStateId(state.id);
    return {
      state: this.mapRegionToDTO(state),
      districts: districts.map((d) => this.mapRegionToDTO(d)),
    };
  }

  async getStatesWithDistricts() {
    const d = alias(regions, "d");

    const rows = await this.db
      .select({
        state: {
          id: regions.id,
          name: regions.name,
          slug: regions.slug,
          type: regions.type,
          centerLat: regions.centerLat,
          centerLng: regions.centerLng,
          bounds: regions.bounds,
          geojson: regions.geojson,
          parentId: regions.parentId,
          createdAt: regions.createdAt,
          updatedAt: regions.updatedAt,
        },
        district: {
          id: d.id,
          name: d.name,
          slug: d.slug,
          type: d.type,
          centerLat: d.centerLat,
          centerLng: d.centerLng,
          bounds: d.bounds,
          geojson: d.geojson,
          parentId: d.parentId,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        },
      })
      .from(regions)
      .leftJoin(
        d,
        and(
          // parentId is text; cast state id (number) to text for join
          eq(d.parentId, sql<string>`cast(${regions.id} as text)`),
          eq(d.type, "district")
        )
      )
      .where(eq(regions.type, "state"))
      .orderBy(asc(regions.name), asc(d.name));

    const hierarchy: RegionHierarchy = [];
    for (const row of rows) {
      if (!hierarchy.find((h) => h.state.id === row.state.id)) {
        hierarchy.push({
          state: row.state,
          districts: [],
        });
      }

      if (row.district) {
        hierarchy
          .find((h) => h.state.id === row.state.id)
          ?.districts.push(row.district);
      }
    }

    return hierarchy;
  }

  async getCountry(): Promise<RegionDTO | null> {
    const country = await this.db.query.regions.findFirst({
      where: eq(regions.type, "country"),
    });
    if (!country) return null;
    return this.mapRegionToDTO(country);
  }

  async getAllDistricts(): Promise<RegionDTO[]> {
    const rows = await this.db.query.regions.findMany({
      where: eq(regions.type, "district"),
      orderBy: asc(regions.name),
    });
    return rows.map((r) => this.mapRegionToDTO(r));
  }

  async getAllDistrictsWithStateSlug(): Promise<DistrictWithStateDTO[]> {
    const d = alias(regions, "d");
    const s = alias(regions, "s");

    const rows = await this.db
      .select({
        district: {
          id: d.id,
          name: d.name,
          slug: d.slug,
          geojson: d.geojson,
          parentId: d.parentId,
          type: d.type,
        },
        state: {
          id: s.id,
          slug: s.slug,
          type: s.type,
        },
      })
      .from(d)
      .leftJoin(
        s,
        and(
          eq(s.type, "state"),
          eq(d.parentId, sql<string>`cast(${s.id} as text)`)
        )
      )
      .where(eq(d.type, "district"))
      .orderBy(asc(d.name));

    const out: DistrictWithStateDTO[] = [];
    for (const row of rows) {
      if (!row.state) continue;
      out.push({
        id: row.district.id,
        name: row.district.name,
        slug: row.district.slug,
        stateSlug: row.state.slug,
        geojson: this.parseJsonColumn<unknown>(row.district.geojson),
      });
    }
    return out;
  }
}
