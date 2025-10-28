import type { DrizzleD1Database } from "drizzle-orm/d1";
import { dbClient } from "~/db/client";

export class BaseService {
  protected readonly db: DrizzleD1Database<typeof import("~/db/schema")>;

  constructor(protected readonly d1Database: D1Database) {
    this.db = dbClient(d1Database);
  }
}
