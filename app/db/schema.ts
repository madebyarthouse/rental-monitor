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

  parentId: integer({ mode: "number" }).references(
    (): AnySQLiteColumn => regions.id
  ),

  centerLat: real().notNull(),
  centerLng: real().notNull(),
  bounds: text("", { mode: "json" }),
  geojson: text("", { mode: "json" }),

  createdAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Listings table - Core listing information
export const listings = sqliteTable(
  "listings",
  {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    platformListingId: text().notNull(),
    title: text().notNull(),
    price: real().notNull(),
    area: real(),
    rooms: integer(),
    zipCode: text(),
    city: text(),
    district: text(),
    state: text(),
    latitude: real(),
    longitude: real(),

    // Duration info
    isLimited: integer({ mode: "boolean" }).notNull().default(false),
    durationMonths: integer(),

    // Platform and URL
    platform: text().notNull(), // 'willhaben', 'derstandard'
    url: text().notNull().unique(),
    externalId: text(), // Platform's original ID

    // Region reference
    regionId: integer({ mode: "number" }).references(() => regions.id),

    // Seller reference
    sellerId: integer({ mode: "number" }).references(() => sellers.id),

    // Tracking timestamps
    firstSeenAt: integer({ mode: "timestamp" }).notNull(),
    lastSeenAt: integer({ mode: "timestamp" }).notNull(),
    lastScrapedAt: integer({ mode: "timestamp" }), // When we last attempted to scrape
    lastVerifiedAt: integer({ mode: "timestamp" }), // When we last verified it exists
    deactivatedAt: integer({ mode: "timestamp" }), // When marked as inactive

    // Status tracking
    isActive: integer({ mode: "boolean" }).notNull().default(true),
    verificationStatus: text({
      enum: ["active", "pending_verification", "not_found", "inactive"],
    }).default("active"),
    notFoundCount: integer({ mode: "number" }).default(0),

    // Metadata
    createdAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return [
      {
        regionIdx: index("idx_listings_region").on(table.regionId),
        sellerIdx: index("idx_listings_seller").on(table.sellerId),
      },
    ];
  }
);

// Sellers/Profiles table
export const sellers = sqliteTable(
  "sellers",
  {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    platformSellerId: text().notNull(),
    platform: text().notNull(),

    // Basic info
    name: text(),
    isPrivate: integer({ mode: "boolean" }).default(false),
    isVerified: integer({ mode: "boolean" }).default(false),

    // Profile details
    registerDate: text(),
    location: text(),
    activeAdCount: integer(),
    totalAdCount: integer(),

    // Organization details (for commercial sellers)
    organisationName: text(),
    organisationPhone: text(),
    organisationEmail: text(),
    organisationWebsite: text(),
    hasProfileImage: integer({ mode: "boolean" }).default(false),

    // Tracking
    firstSeenAt: integer({ mode: "timestamp" }).notNull(),
    lastSeenAt: integer({ mode: "timestamp" }).notNull(),
    lastUpdatedAt: integer({ mode: "timestamp" }).notNull(),

    // Metadata
    createdAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return [
      {
        platformIdx: index("idx_sellers_platform").on(table.platform),
        activeAdsIdx: index("idx_sellers_active_ads").on(table.activeAdCount),
        nameIdx: index("idx_sellers_name").on(table.name),
      },
    ];
  }
);
export const priceHistory = sqliteTable(
  "price_history",
  {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    listingId: integer({ mode: "number" })
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    price: real().notNull(),
    observedAt: integer({ mode: "timestamp" }).notNull(),
    createdAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return [
      {
        listingIdx: index("idx_price_history_listing").on(table.listingId),
      },
    ];
  }
);

export const sellerHistory = sqliteTable(
  "seller_history",
  {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    sellerId: integer({ mode: "number" })
      .notNull()
      .references(() => sellers.id, { onDelete: "cascade" }),
    activeAdCount: integer(),
    totalAdCount: integer(),
    observedAt: integer({ mode: "timestamp" }).notNull(),
    createdAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return [
      {
        sellerIdx: index("idx_seller_history_seller").on(table.sellerId),
      },
    ];
  }
);

export const regionsRelations = relations(regions, ({ one, many }) => ({
  parent: one(regions, {
    fields: [regions.parentId],
    references: [regions.id],
    relationName: "parentChild",
  }),
  children: many(regions, {
    relationName: "parentChild",
  }),
  listings: many(listings),
}));

// Listings relations
export const listingsRelations = relations(listings, ({ one, many }) => ({
  region: one(regions, {
    fields: [listings.regionId],
    references: [regions.id],
  }),
  seller: one(sellers, {
    fields: [listings.sellerId],
    references: [sellers.id],
  }),
  priceHistory: many(priceHistory),
}));

// Sellers relations
export const sellersRelations = relations(sellers, ({ many }) => ({
  listings: many(listings),
  history: many(sellerHistory),
}));

// Price history relations
export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  listing: one(listings, {
    fields: [priceHistory.listingId],
    references: [listings.id],
  }),
}));

// Seller history relations
export const sellerHistoryRelations = relations(sellerHistory, ({ one }) => ({
  seller: one(sellers, {
    fields: [sellerHistory.sellerId],
    references: [sellers.id],
  }),
}));
