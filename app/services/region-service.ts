import { BaseService } from "./base";

export class RegionService extends BaseService {
  constructor(d1Database: D1Database) {
    super(d1Database);
  }

  async getRegions() {
    return this.db.query.regions.findMany();
  }
}
