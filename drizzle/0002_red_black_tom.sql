DROP TABLE "time_entries" CASCADE;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "actual_minutes" integer;--> statement-breakpoint
DROP TYPE "public"."time_entry_source";