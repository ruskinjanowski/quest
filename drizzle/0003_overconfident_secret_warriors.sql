CREATE TYPE "public"."task_horizon" AS ENUM('week', 'month', 'quarter', 'year', 'someday', 'never');--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "horizon" "task_horizon";