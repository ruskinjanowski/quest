import { isNull } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { tasks } from "./tasks";

/**
 * Tracked time. A task's tracked time is the sum of its entries — nothing is
 * denormalised onto `tasks`, and no split/percentage is ever stored: Insights
 * are date-range aggregations over this table (PRODUCT_PLAN §5).
 *
 * Two shapes share the table:
 * - `source = "timer"` — `startedAt` set, `endedAt` null while running.
 * - `source = "manual"` — `durationMinutes` set directly, no wall-clock window.
 *
 * `userId` is denormalised from the task so every read can be scoped to the
 * owner without a join.
 */

export const timeEntrySourceEnum = pgEnum("time_entry_source", ["timer", "manual"]);

export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    source: timeEntrySourceEnum("source").notNull().default("timer"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    /** Set for manual entries; overrides the wall-clock window when present. */
    durationMinutes: integer("duration_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("time_entries_user_id_started_at_idx").on(table.userId, table.startedAt),
    index("time_entries_task_id_idx").on(table.taskId),
    /**
     * "One running timer at a time" (PRODUCT_PLAN §5) enforced in the database,
     * so a double-submit cannot leave two clocks running.
     */
    uniqueIndex("time_entries_one_running_per_user_idx")
      .on(table.userId)
      .where(isNull(table.endedAt)),
  ],
);

export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
