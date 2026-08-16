import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quests, tasks, timeEntries } from "@/db/schema";
import { MS_PER_MINUTE } from "@/features/time-tracking/domain";
import { dayRange, todayKey } from "@/lib/time";
import {
  DEMO_BACKLOG_TASKS,
  DEMO_QUESTS,
  buildDemoEntries,
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
): Promise<{ quests: number; tasks: number; entries: number }> {
  const { timeZone = "UTC", historyDays = 28 } = options;

  // Order matters only for clarity — the FK cascades would handle it anyway.
  await db.delete(timeEntries).where(eq(timeEntries.userId, userId));
  await db.delete(tasks).where(eq(tasks.userId, userId));
  await db.delete(quests).where(eq(quests.userId, userId));

  const insertedQuests = await db
    .insert(quests)
    .values(
      DEMO_QUESTS.map((quest, index) => ({
        userId,
        name: quest.name,
        color: quest.color,
        lifecycle: quest.lifecycle,
        health: quest.health,
        targetHoursWeek: quest.targetHoursWeek,
        sortOrder: index,
        completedAt: quest.lifecycle === "completed" ? new Date() : null,
      })),
    )
    .returning({ id: quests.id });

  const today = todayKey(timeZone);
  const entrySpecs = buildDemoEntries(historyDays);

  /** One task per (day, quest, title) so tracked time lands on realistic rows. */
  const taskKeys = new Map<string, { title: string; questIndex: number | null; dateKey: string }>();

  for (const spec of entrySpecs) {
    const dateKey = shiftDateKey(today, -spec.daysAgo, timeZone);
    const key = `${dateKey}|${spec.questIndex ?? "admin"}|${spec.taskTitle}`;
    if (!taskKeys.has(key)) {
      taskKeys.set(key, { title: spec.taskTitle, questIndex: spec.questIndex, dateKey });
    }
  }

  const plannedTasks = [...taskKeys.entries()].map(([key, task], index) => ({
    key,
    values: {
      userId,
      questId: task.questIndex === null ? null : insertedQuests[task.questIndex].id,
      title: task.title,
      plannedDate: task.dateKey,
      // Everything before today is finished; today's list is still in progress.
      done: task.dateKey !== today,
      completedAt: task.dateKey !== today ? new Date() : null,
      sortOrder: index,
    },
  }));

  const backlogTasks = DEMO_BACKLOG_TASKS.map((task, index) => ({
    userId,
    questId: task.questIndex === null ? null : insertedQuests[task.questIndex].id,
    title: task.title,
    plannedDate: null,
    done: false,
    sortOrder: plannedTasks.length + index,
  }));

  const insertedTasks = await db
    .insert(tasks)
    .values([...plannedTasks.map((task) => task.values), ...backlogTasks])
    .returning({ id: tasks.id });

  const taskIdByKey = new Map(
    plannedTasks.map((task, index) => [task.key, insertedTasks[index].id]),
  );

  const entryValues = entrySpecs.map((spec) => {
    const dateKey = shiftDateKey(today, -spec.daysAgo, timeZone);
    const key = `${dateKey}|${spec.questIndex ?? "admin"}|${spec.taskTitle}`;
    const startedAt = new Date(
      dayRange(dateKey, timeZone).start.getTime() + spec.startHour * 60 * MS_PER_MINUTE,
    );

    return {
      userId,
      taskId: taskIdByKey.get(key)!,
      source: "manual" as const,
      startedAt,
      endedAt: new Date(startedAt.getTime() + spec.minutes * MS_PER_MINUTE),
      durationMinutes: spec.minutes,
    };
  });

  await db.insert(timeEntries).values(entryValues);

  return {
    quests: insertedQuests.length,
    tasks: insertedTasks.length,
    entries: entryValues.length,
  };
}

/** Moves a yyyy-MM-dd key by whole days, staying in the user's zone. */
function shiftDateKey(dateKey: string, days: number, timeZone: string): string {
  const base = dayRange(dateKey, timeZone).start;
  const shifted = new Date(base.getTime() + days * 24 * 60 * MS_PER_MINUTE);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);
}
