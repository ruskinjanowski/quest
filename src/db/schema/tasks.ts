import {
  boolean,
  date,
  index,
  integer,
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
 */

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
    estimateMinutes: integer("estimate_minutes"),
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
