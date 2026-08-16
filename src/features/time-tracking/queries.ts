import "server-only";
import { and, desc, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { quests, tasks, timeEntries } from "@/db/schema";
import type { DateRange } from "@/lib/time";

/**
 * Reads over tracked time. These return rows; turning rows into numbers is the
 * job of `domain.ts` and the Insights aggregations, which stay pure.
 */

export type TrackedEntry = {
  id: string;
  taskId: string;
  taskTitle: string;
  questId: string | null;
  source: "timer" | "manual";
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
};

/** Every entry overlapping `range`, so a timer spanning a boundary still counts. */
export async function listEntriesInRange(
  userId: string,
  range: DateRange,
): Promise<TrackedEntry[]> {
  return db
    .select({
      id: timeEntries.id,
      taskId: timeEntries.taskId,
      taskTitle: tasks.title,
      questId: tasks.questId,
      source: timeEntries.source,
      startedAt: timeEntries.startedAt,
      endedAt: timeEntries.endedAt,
      durationMinutes: timeEntries.durationMinutes,
    })
    .from(timeEntries)
    .innerJoin(tasks, eq(tasks.id, timeEntries.taskId))
    .where(
      and(
        eq(timeEntries.userId, userId),
        lt(timeEntries.startedAt, range.end),
        or(isNull(timeEntries.endedAt), gt(timeEntries.endedAt, range.start)),
      ),
    )
    .orderBy(desc(timeEntries.startedAt));
}

export type RunningTimer = {
  entryId: string;
  taskId: string;
  taskTitle: string;
  questId: string | null;
  questName: string | null;
  questColor: string | null;
  startedAt: Date;
};

/** At most one per user — the partial unique index guarantees it. */
export async function getRunningTimer(userId: string): Promise<RunningTimer | null> {
  const [row] = await db
    .select({
      entryId: timeEntries.id,
      taskId: timeEntries.taskId,
      taskTitle: tasks.title,
      questId: tasks.questId,
      questName: quests.name,
      questColor: quests.color,
      startedAt: timeEntries.startedAt,
    })
    .from(timeEntries)
    .innerJoin(tasks, eq(tasks.id, timeEntries.taskId))
    .leftJoin(quests, eq(quests.id, tasks.questId))
    .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endedAt)))
    .limit(1);

  return row ?? null;
}

/** All-time entries for a set of tasks — how a task row shows its tracked total. */
export async function listEntriesForTasks(userId: string, taskIds: readonly string[]) {
  if (taskIds.length === 0) return [];

  return db
    .select({
      taskId: timeEntries.taskId,
      source: timeEntries.source,
      startedAt: timeEntries.startedAt,
      endedAt: timeEntries.endedAt,
      durationMinutes: timeEntries.durationMinutes,
    })
    .from(timeEntries)
    .where(
      and(eq(timeEntries.userId, userId), inArray(timeEntries.taskId, [...taskIds])),
    );
}

export async function listEntriesForTask(userId: string, taskId: string) {
  return db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), eq(timeEntries.taskId, taskId)))
    .orderBy(desc(timeEntries.startedAt));
}
