import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const regions = sqliteTable("regions", {
  id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  type: text({
    enum: ["country", "state", "district", "city"],
  }).notNull(),

  parentId: text().references((): AnySQLiteColumn => regions.id),

  centerLat: real().notNull(),
  centerLng: real().notNull(),
  bounds: text("", { mode: "json" }),
  geojson: text("", { mode: "json" }),

  createdAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});
