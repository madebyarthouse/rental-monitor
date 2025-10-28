import { eq, and, asc } from "drizzle-orm";
import { BaseService } from "./base";
import { regions } from "@/db/schema";

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
}
