CREATE TABLE `daily_version_scores` (
	`day` text NOT NULL,
	`device` text NOT NULL,
	`version` text NOT NULL,
	`size` integer NOT NULL,
	`eaten` integer NOT NULL,
	`seconds` real NOT NULL,
	`updated` integer NOT NULL,
	PRIMARY KEY(`day`, `device`, `version`)
);
--> statement-breakpoint
ALTER TABLE `runs` ADD `version` text DEFAULT 'unknown' NOT NULL;