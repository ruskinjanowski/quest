import { eq } from "drizzle-orm";
import { db } from "@/db";
import { type NewTask, quests, tasks } from "@/db/schema";
import { shiftDateKey, todayKey } from "@/lib/time";
import {
  DEMO_BACKLOG_TASKS,
  DEMO_QUESTS,
  DEMO_UPCOMING_TASKS,
  buildDemoHistory,
} from "./data";

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
        completedAt: quest.lifecycle === "completed" ? new Date() : null,
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
    completedAt: new Date(),
    sortOrder: sortOrder++,
  }));

  /**
   * Today and the next two days, unfinished: the board has to open on a plan
   * you can work, not on a finished day. One task is already ticked off so the
   * first column's progress bar and split have something to say.
   */
  const upcoming: NewTask[] = DEMO_UPCOMING_TASKS.map((task, index) => {
    const done = task.daysAhead === 0 && index === 2;

    return {
      userId,
      questId: questId(task.questIndex),
      title: task.title,
      plannedDate: shiftDateKey(today, task.daysAhead, timeZone),
      estimateMinutes: task.estimateMinutes,
      actualMinutes: done ? task.estimateMinutes + 10 : null,
      done,
      completedAt: done ? new Date() : null,
      sortOrder: sortOrder++,
    };
  });

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
    .values([...history, ...upcoming, ...backlog])
    .returning({ id: tasks.id });

  return { quests: insertedQuests.length, tasks: inserted.length };
}
