CREATE TABLE `listings` (
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
	`regionId` integer,
	`sellerId` integer,
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
	FOREIGN KEY (`regionId`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listings_url_unique` ON `listings` (`url`);--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listingId` integer NOT NULL,
	`price` real NOT NULL,
	`observedAt` integer NOT NULL,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`parentId` integer,
	`centerLat` real NOT NULL,
	`centerLng` real NOT NULL,
	`bounds` text,
	`geojson` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`parentId`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regions_slug_unique` ON `regions` (`slug`);--> statement-breakpoint
CREATE TABLE `seller_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sellerId` integer NOT NULL,
	`activeAdCount` integer,
	`totalAdCount` integer,
	`observedAt` integer NOT NULL,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sellers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platformSellerId` text NOT NULL,
	`platform` text NOT NULL,
	`name` text,
	`isPrivate` integer DEFAULT false,
	`isVerified` integer DEFAULT false,
	`registerDate` text,
	`location` text,
	`activeAdCount` integer,
	`totalAdCount` integer,
	`organisationName` text,
	`organisationPhone` text,
	`organisationEmail` text,
	`organisationWebsite` text,
	`hasProfileImage` integer DEFAULT false,
	`firstSeenAt` integer NOT NULL,
	`lastSeenAt` integer NOT NULL,
	`lastUpdatedAt` integer NOT NULL,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP
);
