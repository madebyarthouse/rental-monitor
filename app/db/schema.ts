import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const regions = sqliteTable(
  "regions",
  {
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
  },
  (table) => ({
    // Accelerate lookups like: WHERE type = 'state' ORDER BY name
    typeNameIdx: index("idx_regions_type_name").on(table.type, table.name),
    // Speed up district queries by state id + type
    parentTypeIdx: index("idx_regions_parent_type").on(
      table.parentId,
      table.type
    ),
    // General name ordering support
    nameIdx: index("idx_regions_name").on(table.name),
  })
);

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
    platform: text().notNull(),
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
  (table) => ({
    regionIdx: index("idx_listings_region").on(table.regionId),
    sellerIdx: index("idx_listings_seller").on(table.sellerId),
    // Frequent equality/range filters + sorts
    activeLastSeenIdx: index("idx_listings_active_last_seen").on(
      table.isActive,
      table.lastSeenAt
    ),
    activeRegionLastSeenIdx: index("idx_listings_active_region_last_seen").on(
      table.isActive,
      table.regionId,
      table.lastSeenAt
    ),
    // Scraper lookup by platform listing id
    platformListingIdx: index("idx_listings_platform_listing").on(
      table.platformListingId
    ),
    // Filters and fallbacks
    priceIdx: index("idx_listings_price").on(table.price),
    areaIdx: index("idx_listings_area").on(table.area),
    roomsIdx: index("idx_listings_rooms").on(table.rooms),
    platformIdx2: index("idx_listings_platform").on(table.platform),
    districtIdx: index("idx_listings_district").on(table.district),
    stateIdx: index("idx_listings_state").on(table.state),
  })
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
  (table) => ({
    platformIdx: index("idx_sellers_platform").on(table.platform),
    activeAdsIdx: index("idx_sellers_active_ads").on(table.activeAdCount),
    nameIdx: index("idx_sellers_name").on(table.name),
    // Ensure fast upsert/lookup by platform + seller id
    uniquePlatformSellerIdx: uniqueIndex(
      "uniq_sellers_platform_platformSeller"
    ).on(table.platform, table.platformSellerId),
  })
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
  (table) => ({
    listingIdx: index("idx_price_history_listing").on(table.listingId),
  })
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
  (table) => ({
    sellerIdx: index("idx_seller_history_seller").on(table.sellerId),
  })
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

// Runs tracking table for scheduled scraper executions
export const scrapeRuns = sqliteTable(
  "scrape_runs",
  {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    type: text({
      enum: ["discovery", "sweep", "verification"],
    }).notNull(),
    status: text({
      enum: ["pending", "running", "success", "error"],
    })
      .notNull()
      .default("pending"),

    // Timing
    startedAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
    finishedAt: integer({ mode: "timestamp" }),
    durationMs: integer({ mode: "number" }),

    // Error
    errorMessage: text(),

    // Metrics (nullable when not applicable)
    overviewPagesVisited: integer({ mode: "number" }),
    detailPagesFetched: integer({ mode: "number" }),
    listingsDiscovered: integer({ mode: "number" }),
    listingsUpdated: integer({ mode: "number" }),
    listingsVerified: integer({ mode: "number" }),
    listingsNotFound: integer({ mode: "number" }),
    priceHistoryInserted: integer({ mode: "number" }),
    priceChangesDetected: integer({ mode: "number" }),
    lastOverviewPage: integer({ mode: "number" }),

    // Metadata
    createdAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    typeIdx: index("idx_scrape_runs_type").on(table.type),
    statusIdx: index("idx_scrape_runs_status").on(table.status),
    startedAtIdx: index("idx_scrape_runs_started_at").on(table.startedAt),
    // Optimize "last run by type" query
    typeStartedAtIdx: index("idx_scrape_runs_type_started_at").on(
      table.type,
      table.startedAt
    ),
  })
);
