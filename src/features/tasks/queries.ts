import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { quests, tasks } from "@/db/schema";
import type { DateKey } from "@/lib/time";
import { entryMinutes, isRunning } from "../time-tracking/domain";
import { listEntriesForTasks } from "../time-tracking/queries";

/**
 * The row shape every task list renders. Assembled here once so Today, the
 * backlog and the quest detail page can't drift into three different ideas of
 * what a task looks like.
 */
export type TaskRow = {
  id: string;
  title: string;
  questId: string | null;
  questName: string | null;
  questColor: string | null;
  plannedDate: string | null;
  estimateMinutes: number | null;
  done: boolean;
  sortOrder: number;
  trackedMinutes: number;
  isRunning: boolean;
};

const taskSelection = {
  id: tasks.id,
  title: tasks.title,
  questId: tasks.questId,
  questName: quests.name,
  questColor: quests.color,
  plannedDate: tasks.plannedDate,
  estimateMinutes: tasks.estimateMinutes,
  done: tasks.done,
  sortOrder: tasks.sortOrder,
};

type TaskBase = {
  [K in keyof typeof taskSelection]: TaskRow[K & keyof TaskRow];
};

/** Attaches tracked time to a batch of tasks in one extra query. */
async function withTrackedTime(
  userId: string,
  rows: TaskBase[],
): Promise<TaskRow[]> {
  const entries = await listEntriesForTasks(
    userId,
    rows.map((row) => row.id),
  );

  const now = new Date();
  const tracked = new Map<string, { minutes: number; running: boolean }>();

  for (const entry of entries) {
    const current = tracked.get(entry.taskId) ?? { minutes: 0, running: false };
    tracked.set(entry.taskId, {
      minutes: current.minutes + entryMinutes(entry, now),
      running: current.running || isRunning(entry),
    });
  }

  return rows.map((row) => ({
    ...row,
    trackedMinutes: tracked.get(row.id)?.minutes ?? 0,
    isRunning: tracked.get(row.id)?.running ?? false,
  }));
}

export async function listTasksForDay(
  userId: string,
  dateKey: DateKey,
): Promise<TaskRow[]> {
  const rows = await db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(quests, eq(quests.id, tasks.questId))
    .where(and(eq(tasks.userId, userId), eq(tasks.plannedDate, dateKey)))
    .orderBy(asc(tasks.done), asc(tasks.sortOrder), asc(tasks.createdAt));

  return withTrackedTime(userId, rows);
}

/** Unscheduled tasks — the backlog / quick-capture surface. */
export async function listBacklogTasks(userId: string): Promise<TaskRow[]> {
  const rows = await db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(quests, eq(quests.id, tasks.questId))
    .where(
      and(eq(tasks.userId, userId), isNull(tasks.plannedDate), eq(tasks.done, false)),
    )
    .orderBy(asc(tasks.sortOrder), desc(tasks.createdAt));

  return withTrackedTime(userId, rows);
}

export async function listTasksForQuest(
  userId: string,
  questId: string,
): Promise<TaskRow[]> {
  const rows = await db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(quests, eq(quests.id, tasks.questId))
    .where(and(eq(tasks.userId, userId), eq(tasks.questId, questId)))
    .orderBy(asc(tasks.done), desc(tasks.plannedDate), asc(tasks.sortOrder));

  return withTrackedTime(userId, rows);
}
