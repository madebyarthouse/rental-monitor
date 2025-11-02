CREATE TABLE `scrape_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`startedAt` integer DEFAULT CURRENT_TIMESTAMP,
	`finishedAt` integer,
	`durationMs` integer,
	`errorMessage` text,
	`overviewPagesVisited` integer,
	`detailPagesFetched` integer,
	`listingsDiscovered` integer,
	`listingsUpdated` integer,
	`listingsVerified` integer,
	`listingsNotFound` integer,
	`priceHistoryInserted` integer,
	`priceChangesDetected` integer,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP
);
