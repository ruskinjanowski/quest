import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { quests } from "./quests";

/**
 * A task is a unit of work for a day.
 *
 * `questId === null` *is* the Admin bucket — there is no admin quest row.
 * That binary is the product's core metric, so it must stay a single nullable
 * column rather than anything cleverer.
 *
 * `plannedDate === null` means the task sits in the backlog, unscheduled.
 *
 * Time is two numbers on the task itself, Sunsama's `PLANNED` / `ACTUAL` pair:
 * `estimateMinutes` is what you committed to, `actualMinutes` what it took.
 * There is no time-entry table and no clock — a task banks
 * `actualMinutes ?? estimateMinutes` when it's ticked off, which is what every
 * split in the app aggregates.
 */

/**
 * How far out a backlog task is really being considered. Lifted from Sunsama's
 * backlog buckets, "Never" included: a planner that can't admit you're not
 * going to do something just accumulates guilt.
 */
export const taskHorizonEnum = pgEnum("task_horizon", [
  "week",
  "month",
  "quarter",
  "year",
  "someday",
  "never",
]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questId: uuid("quest_id").references(() => quests.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    /** Optional longer description — Clockify-style detail on what the work is. */
    notes: text("notes"),
    /** Calendar day, in the user's local timezone. Null = backlog. */
    plannedDate: date("planned_date"),
    /** `PLANNED` — the estimate you committed to when you scheduled it. */
    estimateMinutes: integer("estimate_minutes"),
    /** `ACTUAL` — what it really took. Null falls back to the estimate. */
    actualMinutes: integer("actual_minutes"),
    /** Only meaningful while `plannedDate` is null. Null reads as "week". */
    horizon: taskHorizonEnum("horizon"),
    done: boolean("done").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_user_id_planned_date_idx").on(table.userId, table.plannedDate),
    index("tasks_quest_id_idx").on(table.questId),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskHorizon = NonNullable<Task["horizon"]>;
