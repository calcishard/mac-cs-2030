CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`data` blob NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`email` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`show_on_board` integer NOT NULL,
	`name` text,
	`note` text,
	`tagline` text,
	`bio` text,
	`project` text,
	`interests` text,
	`photo_id` text,
	`photo_position` text,
	`answers` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`approved_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `submissions_public_id_unique` ON `submissions` (`public_id`);--> statement-breakpoint
CREATE INDEX `submissions_status_idx` ON `submissions` (`status`);