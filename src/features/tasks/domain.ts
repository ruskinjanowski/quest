import { share } from "@/lib/duration";

/**
 * The arithmetic of a planned day, as pure functions — no database, no React.
 *
 * Every number the product shows comes from two fields on a task: `PLANNED`
 * (the estimate) and `ACTUAL` (what it took). There is no timer and no
 * time-entry table, so "how did my week go" is a sum over tasks and nothing
 * else. Splits and percentages are never stored (CLAUDE.md rule 4).
 */

export type TimedTask = {
  /** `null` is the Admin bucket, as everywhere else. */
  questId: string | null;
  estimateMinutes: number | null;
  actualMinutes: number | null;
  done: boolean;
};

/** A working day, until it's a per-user setting. */
export const DAY_CAPACITY_MINUTES = 8 * 60;

/** When the projected day starts, for the times shown on task cards. */
export const DAY_START_MINUTE = 9 * 60;

/** What an unestimated task is assumed to cost when laying out the day. */
export const ASSUMED_TASK_MINUTES = 30;

/**
 * What a task *cost*: its actual if one was entered, otherwise what it was
 * planned to take. This single fallback is why precision stays optional —
 * ticking a task off is always enough to make the split answerable.
 */
export function costOf(task: TimedTask): number {
  return task.actualMinutes ?? task.estimateMinutes ?? 0;
}

/** Only finished work counts as spent — the rest is still a plan. */
export function spentOn(task: TimedTask): number {
  return task.done ? costOf(task) : 0;
}

export type DaySummary = {
  /** Sum of estimates across every task on the day. */
  plannedMinutes: number;
  /** Sum of costs across the finished ones. */
  actualMinutes: number;
  /** The planned split — what the day is *for*. */
  questMinutes: number;
  adminMinutes: number;
  questShare: number;
  adminShare: number;
  /** The same split over finished work only, for a day that's underway. */
  questDoneMinutes: number;
  adminDoneMinutes: number;
  taskCount: number;
  doneCount: number;
  unestimatedCount: number;
};

/**
 * The day in one object.
 *
 * The headline split is the *planned* one, deliberately. A day column is a
 * plan, and a plan's honest question is "what is today for" — reporting only
 * finished work would have one early admin task announce that the day is 0%
 * quest before lunch. What actually happened is the week's question, and Home
 * answers it there.
 */
export function summariseDay(tasks: readonly TimedTask[]): DaySummary {
  let plannedMinutes = 0;
  let actualMinutes = 0;
  let questMinutes = 0;
  let adminMinutes = 0;
  let questDoneMinutes = 0;
  let adminDoneMinutes = 0;
  let doneCount = 0;
  let unestimatedCount = 0;

  for (const task of tasks) {
    const planned = task.estimateMinutes ?? 0;
    plannedMinutes += planned;
    if (task.estimateMinutes === null) unestimatedCount += 1;

    if (task.questId === null) adminMinutes += planned;
    else questMinutes += planned;

    if (!task.done) continue;

    const spent = costOf(task);
    doneCount += 1;
    actualMinutes += spent;
    if (task.questId === null) adminDoneMinutes += spent;
    else questDoneMinutes += spent;
  }

  const total = questMinutes + adminMinutes;

  return {
    plannedMinutes,
    actualMinutes,
    questMinutes,
    adminMinutes,
    questShare: share(questMinutes, total),
    adminShare: share(adminMinutes, total),
    questDoneMinutes,
    adminDoneMinutes,
    taskCount: tasks.length,
    doneCount,
    unestimatedCount,
  };
}

/**
 * How full the day is. `over` is the one that matters — the core honesty
 * mechanic is telling you the list doesn't fit *before* you start working it.
 */
export type Workload = "empty" | "light" | "balanced" | "full" | "over";

export function workloadFor(
  plannedMinutes: number,
  capacityMinutes: number = DAY_CAPACITY_MINUTES,
): Workload {
  if (plannedMinutes <= 0) return "empty";

  const used = share(plannedMinutes, capacityMinutes);
  if (used > 1) return "over";
  if (used >= 0.85) return "full";
  if (used >= 0.4) return "balanced";
  return "light";
}

/** Minutes planned beyond capacity — 0 when the day fits. */
export function overloadMinutes(
  plannedMinutes: number,
  capacityMinutes: number = DAY_CAPACITY_MINUTES,
): number {
  return Math.max(0, plannedMinutes - capacityMinutes);
}

/**
 * Lays the day's tasks end to end from `DAY_START_MINUTE` and returns the
 * minute each one starts at.
 *
 * Nothing is stored: a task carries a duration but no time of day, so the clock
 * on a card is a projection of the list's own order. That is what makes
 * reordering meaningful — drag a task up and its time, and every time below it,
 * moves. It also feeds the timeline rail, so the list and the picture of the
 * day can never disagree.
 */
export function projectStarts(
  tasks: readonly { id: string; estimateMinutes: number | null }[],
  startMinute: number = DAY_START_MINUTE,
): Map<string, number> {
  const starts = new Map<string, number>();
  let cursor = startMinute;

  for (const task of tasks) {
    starts.set(task.id, cursor);
    cursor += task.estimateMinutes ?? ASSUMED_TASK_MINUTES;
  }

  return starts;
}
