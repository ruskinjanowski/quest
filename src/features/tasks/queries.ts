import "server-only";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lt, lte } from "drizzle-orm";
import { db } from "@/db";
import { type TaskHorizon, quests, tasks } from "@/db/schema";
import type { DateKey } from "@/lib/time";

/**
 * The row shape every task list renders. Assembled here once so the day board,
 * the backlog and the quest detail page can't drift into three different ideas
 * of what a task looks like.
 */
export type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  questId: string | null;
  questName: string | null;
  questColor: string | null;
  plannedDate: string | null;
  /** `PLANNED` on the card. */
  estimateMinutes: number | null;
  /** `ACTUAL` on the card — null means "however long it was planned to take". */
  actualMinutes: number | null;
  horizon: TaskHorizon | null;
  done: boolean;
  sortOrder: number;
};

const taskSelection = {
  id: tasks.id,
  title: tasks.title,
  notes: tasks.notes,
  questId: tasks.questId,
  questName: quests.name,
  questColor: quests.color,
  plannedDate: tasks.plannedDate,
  estimateMinutes: tasks.estimateMinutes,
  actualMinutes: tasks.actualMinutes,
  horizon: tasks.horizon,
  done: tasks.done,
  sortOrder: tasks.sortOrder,
};

/**
 * Every task on a set of days, in one read. The board shows several days side
 * by side, and one query per column would be a waterfall of round trips to a
 * database that charges for each one.
 */
export async function listTasksForDays(
  userId: string,
  dateKeys: readonly DateKey[],
): Promise<TaskRow[]> {
  if (dateKeys.length === 0) return [];

  return db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(quests, eq(quests.id, tasks.questId))
    .where(and(eq(tasks.userId, userId), inArray(tasks.plannedDate, [...dateKeys])))
    .orderBy(asc(tasks.sortOrder), asc(tasks.createdAt));
}

export function listTasksForDay(userId: string, dateKey: DateKey): Promise<TaskRow[]> {
  return listTasksForDays(userId, [dateKey]);
}

/** Every scheduled task in a date range — what the week's split aggregates. */
export function listTasksInRange(
  userId: string,
  fromKey: DateKey,
  toKey: DateKey,
): Promise<TaskRow[]> {
  return db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(quests, eq(quests.id, tasks.questId))
    .where(
      and(
        eq(tasks.userId, userId),
        isNotNull(tasks.plannedDate),
        gte(tasks.plannedDate, fromKey),
        lte(tasks.plannedDate, toKey),
      ),
    )
    .orderBy(asc(tasks.plannedDate), asc(tasks.sortOrder));
}

/** Unscheduled tasks — the backlog / quick-capture surface. */
export function listBacklogTasks(userId: string): Promise<TaskRow[]> {
  return db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(quests, eq(quests.id, tasks.questId))
    .where(
      and(eq(tasks.userId, userId), isNull(tasks.plannedDate), eq(tasks.done, false)),
    )
    .orderBy(asc(tasks.sortOrder), desc(tasks.createdAt));
}

/**
 * Unfinished work from days already gone by. A planner that silently drops
 * yesterday's leftovers is lying to you, so they are offered back explicitly
 * instead of rolling over behind your back.
 */
export function listUnfinishedBefore(
  userId: string,
  dateKey: DateKey,
): Promise<TaskRow[]> {
  return db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(quests, eq(quests.id, tasks.questId))
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.done, false),
        isNotNull(tasks.plannedDate),
        lt(tasks.plannedDate, dateKey),
      ),
    )
    .orderBy(desc(tasks.plannedDate), asc(tasks.sortOrder));
}

export function listTasksForQuest(userId: string, questId: string): Promise<TaskRow[]> {
  return db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(quests, eq(quests.id, tasks.questId))
    .where(and(eq(tasks.userId, userId), eq(tasks.questId, questId)))
    .orderBy(asc(tasks.done), desc(tasks.plannedDate), asc(tasks.sortOrder));
}

/** The next unfinished task on a quest — the "next: …" line on a quest card. */
export async function listNextTaskPerQuest(
  userId: string,
): Promise<Map<string, string>> {
  const rows = await db
    .select({
      questId: tasks.questId,
      title: tasks.title,
      plannedDate: tasks.plannedDate,
      sortOrder: tasks.sortOrder,
    })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.done, false), isNotNull(tasks.questId)))
    // Scheduled work outranks the backlog: nulls sort last, so the soonest
    // planned day wins and an unplanned task only surfaces when nothing is.
    .orderBy(asc(tasks.plannedDate), asc(tasks.sortOrder));

  const next = new Map<string, string>();
  for (const row of rows) {
    if (row.questId && !next.has(row.questId)) next.set(row.questId, row.title);
  }

  return next;
}
