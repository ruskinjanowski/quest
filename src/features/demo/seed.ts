import { eq } from "drizzle-orm";
import { db } from "@/db";
import { type NewTask, quests, tasks } from "@/db/schema";
import { shiftDateKey, todayKey } from "@/lib/time";
import {
  DEMO_BACKLOG_TASKS,
  DEMO_LEFTOVER_TASKS,
  DEMO_QUESTS,
  DEMO_UPCOMING_TASKS,
  buildDemoHistory,
} from "./data";

/** How long ago the finished quest was finished — "Achieved" wants a past. */
const COMPLETED_QUEST_DAYS_AGO = 24;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgoInstant(days: number, now: number): Date {
  return new Date(now - days * DAY_MS);
}

/**
 * Replaces one user's data with the demo dataset.
 *
 * Scoped to a single `userId` on purpose (PRODUCT_PLAN 1.9): "Reset demo data"
 * on a public URL must never touch anybody else's account, and re-shooting the
 * Loom must be a one-click affair.
 */
export async function seedDemoData(
  userId: string,
  options: { timeZone?: string; historyDays?: number } = {},
): Promise<{ quests: number; tasks: number }> {
  const { timeZone = "UTC", historyDays = 28 } = options;
  const now = Date.now();

  // Order matters only for clarity — the FK cascades would handle it anyway.
  await db.delete(tasks).where(eq(tasks.userId, userId));
  await db.delete(quests).where(eq(quests.userId, userId));

  const insertedQuests = await db
    .insert(quests)
    .values(
      DEMO_QUESTS.map((quest, index) => ({
        userId,
        name: quest.name,
        description: quest.description,
        color: quest.color,
        lifecycle: quest.lifecycle,
        health: quest.health,
        targetHoursWeek: quest.targetHoursWeek,
        sortOrder: index,
        completedAt:
          quest.lifecycle === "completed"
            ? daysAgoInstant(COMPLETED_QUEST_DAYS_AGO, now)
            : null,
      })),
    )
    .returning({ id: quests.id });

  const questId = (index: number | null) =>
    index === null ? null : insertedQuests[index].id;

  const today = todayKey(timeZone);
  let sortOrder = 0;

  /** Four weeks of finished days, each task carrying both numbers. */
  const history: NewTask[] = buildDemoHistory(historyDays).map((task) => ({
    userId,
    questId: questId(task.questIndex),
    title: task.title,
    plannedDate: shiftDateKey(today, -task.daysAgo, timeZone),
    estimateMinutes: task.estimateMinutes,
    actualMinutes: task.actualMinutes,
    done: true,
    // Ticked off on the day it was planned for, not all at once at seed time.
    completedAt: daysAgoInstant(task.daysAgo, now),
    sortOrder: sortOrder++,
  }));

  /**
   * Today and the next four days. Today opens mid-morning — a couple of things
   * already ticked off — because the board has to show a plan being worked, not
   * a blank slate or a finished day.
   */
  const upcoming: NewTask[] = DEMO_UPCOMING_TASKS.map((task) => ({
    userId,
    questId: questId(task.questIndex),
    title: task.title,
    notes: task.notes ?? null,
    plannedDate: shiftDateKey(today, task.daysAhead, timeZone),
    estimateMinutes: task.estimateMinutes,
    actualMinutes: task.done ? (task.actualMinutes ?? task.estimateMinutes) : null,
    done: task.done ?? false,
    completedAt: task.done ? new Date(now) : null,
    sortOrder: sortOrder++,
  }));

  /** Unfinished days behind us, so "left over from earlier" is demonstrable. */
  const leftovers: NewTask[] = DEMO_LEFTOVER_TASKS.map((task) => ({
    userId,
    questId: questId(task.questIndex),
    title: task.title,
    plannedDate: shiftDateKey(today, -task.daysAgo, timeZone),
    estimateMinutes: task.estimateMinutes,
    done: false,
    sortOrder: sortOrder++,
  }));

  const backlog: NewTask[] = DEMO_BACKLOG_TASKS.map((task) => ({
    userId,
    questId: questId(task.questIndex),
    title: task.title,
    plannedDate: null,
    estimateMinutes: task.estimateMinutes,
    horizon: task.horizon,
    done: false,
    sortOrder: sortOrder++,
  }));

  const inserted = await db
    .insert(tasks)
    .values([...history, ...leftovers, ...upcoming, ...backlog])
    .returning({ id: tasks.id });

  return { quests: insertedQuests.length, tasks: inserted.length };
}
