import { eq, and, asc, sql } from "drizzle-orm";
import { BaseService } from "./base";
import { regions } from "@/db/schema";
import { alias } from "drizzle-orm/sqlite-core";

type Region = typeof regions.$inferSelect;
export type RegionHierarchy = Array<{
  state: Region;
  districts: Region[];
}>;

export class RegionService extends BaseService {
  constructor(d1Database: D1Database) {
    super(d1Database);
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

  async getStateWithDistricts(stateSlug: string) {
    const state = await this.getRegionBySlug(stateSlug);
    if (!state) return null;
    const districts = await this.getDistrictsByStateId(state.id);
    return { state, districts };
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
}
