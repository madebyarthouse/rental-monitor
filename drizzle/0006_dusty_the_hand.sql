PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platformListingId` text NOT NULL,
	`title` text NOT NULL,
	`price` real NOT NULL,
	`area` real,
	`rooms` integer,
	`zipCode` text,
	`city` text,
	`district` text,
	`state` text,
	`latitude` real,
	`longitude` real,
	`isLimited` integer DEFAULT false NOT NULL,
	`durationMonths` integer,
	`platform` text NOT NULL,
	`url` text NOT NULL,
	`externalId` text,
	`isCommercialSeller` integer,
	`regionId` integer,
	`firstSeenAt` integer NOT NULL,
	`lastSeenAt` integer NOT NULL,
	`lastScrapedAt` integer,
	`lastVerifiedAt` integer,
	`deactivatedAt` integer,
	`isActive` integer DEFAULT true NOT NULL,
	`verificationStatus` text DEFAULT 'active',
	`notFoundCount` integer DEFAULT 0,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`regionId`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_listings`("id", "platformListingId", "title", "price", "area", "rooms", "zipCode", "city", "district", "state", "latitude", "longitude", "isLimited", "durationMonths", "platform", "url", "externalId", "isCommercialSeller", "regionId", "firstSeenAt", "lastSeenAt", "lastScrapedAt", "lastVerifiedAt", "deactivatedAt", "isActive", "verificationStatus", "notFoundCount", "createdAt", "updatedAt") SELECT "id", "platformListingId", "title", "price", "area", "rooms", "zipCode", "city", "district", "state", "latitude", "longitude", "isLimited", "durationMonths", "platform", "url", "externalId", "isCommercialSeller", "regionId", "firstSeenAt", "lastSeenAt", "lastScrapedAt", "lastVerifiedAt", "deactivatedAt", "isActive", "verificationStatus", "notFoundCount", "createdAt", "updatedAt" FROM `listings`;--> statement-breakpoint
DROP TABLE `listings`;--> statement-breakpoint
ALTER TABLE `__new_listings` RENAME TO `listings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `listings_url_unique` ON `listings` (`url`);--> statement-breakpoint
CREATE INDEX `idx_listings_region` ON `listings` (`regionId`);--> statement-breakpoint
CREATE INDEX `idx_listings_active_last_seen` ON `listings` (`isActive`,`lastSeenAt`);--> statement-breakpoint
CREATE INDEX `idx_listings_active_region_last_seen` ON `listings` (`isActive`,`regionId`,`lastSeenAt`);--> statement-breakpoint
CREATE INDEX `idx_listings_platform_listing` ON `listings` (`platformListingId`);--> statement-breakpoint
CREATE INDEX `idx_listings_price` ON `listings` (`price`);--> statement-breakpoint
CREATE INDEX `idx_listings_area` ON `listings` (`area`);--> statement-breakpoint
CREATE INDEX `idx_listings_rooms` ON `listings` (`rooms`);--> statement-breakpoint
CREATE INDEX `idx_listings_platform` ON `listings` (`platform`);--> statement-breakpoint
CREATE INDEX `idx_listings_district` ON `listings` (`district`);--> statement-breakpoint
CREATE INDEX `idx_listings_state` ON `listings` (`state`);

DROP TABLE `seller_history`;--> statement-breakpoint
DROP TABLE `sellers`;--> statement-breakpoint
