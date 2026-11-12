CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`device` text NOT NULL,
	`day` text NOT NULL,
	`started` integer NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_scores` (
	`day` text NOT NULL,
	`device` text NOT NULL,
	`size` integer NOT NULL,
	`eaten` integer NOT NULL,
	`seconds` real NOT NULL,
	`updated` integer NOT NULL,
	PRIMARY KEY(`day`, `device`)
);
--> statement-breakpoint
CREATE INDEX `idx_daily_scores_order` ON `daily_scores` (`day`,`size`,`eaten`,`seconds`);