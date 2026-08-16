import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * A quest is the high-level thing a user is trying to advance.
 *
 * Two orthogonal state fields, deliberately kept apart (PRODUCT_PLAN 0.1 / 1.3b):
 * - `lifecycle` answers "does this quest still count?" — it drives Insights filtering.
 * - `health` answers "how is it going?" — it is a manually set display chip.
 */

export const questLifecycleEnum = pgEnum("quest_lifecycle", [
  "active",
  "completed",
  "archived",
]);

export const questHealthEnum = pgEnum("quest_health", [
  "on_track",
  "at_risk",
  "off_track",
  "achieved",
]);

export const quests = pgTable(
  "quests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Key into the palette in `src/lib/quest-colors.ts`, not a raw hex value. */
    color: text("color").notNull().default("violet"),
    lifecycle: questLifecycleEnum("lifecycle").notNull().default("active"),
    health: questHealthEnum("health"),
    targetHoursWeek: integer("target_hours_week"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("quests_user_id_lifecycle_idx").on(table.userId, table.lifecycle),
    index("quests_user_id_sort_order_idx").on(table.userId, table.sortOrder),
  ],
);

export type Quest = typeof quests.$inferSelect;
export type NewQuest = typeof quests.$inferInsert;
export type QuestLifecycle = Quest["lifecycle"];
export type QuestHealth = NonNullable<Quest["health"]>;
