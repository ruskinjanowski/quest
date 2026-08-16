import { share } from "@/lib/duration";

/**
 * The arithmetic of a planned day, as pure functions.
 *
 * Insights answers "where did my time go?" *after* the fact. This answers the
 * same question *before* it — the projected quest/admin split from estimates —
 * which is the whole point of a planning ritual: you see the shape of the day
 * while you can still change it.
 *
 * Nothing here touches the database or React, so the dialog can recompute the
 * projection on every keystroke client-side using the same code the server
 * renders the day summary with.
 */

/**
 * A working day, until it's a per-user setting. Deliberately a number of hours
 * of *planned work*, not hours awake: the warning should fire when the list is
 * unrealistic, not when the day is long.
 */
export const DAY_CAPACITY_MINUTES = 8 * 60;

export type PlannableTask = {
  /** `null` is the Admin bucket, as everywhere else. */
  questId: string | null;
  estimateMinutes: number | null;
};

/**
 * What the split is a share *of*. A day with tasks but no estimates still has
 * an honest answer to "how much of this advances a quest" — it just counts
 * tasks instead of minutes. Saying "0%" there would be a lie, and it was the
 * first thing the Today page said to anyone who hadn't estimated yet.
 */
export type SplitBasis = "estimates" | "tasks" | "empty";

export type DayProjection = {
  /** Sum of estimates. Tasks without one contribute nothing but are counted. */
  plannedMinutes: number;
  questMinutes: number;
  adminMinutes: number;
  /** Share of `basis`, not necessarily of minutes — read `basis` before wording it. */
  questShare: number;
  adminShare: number;
  basis: SplitBasis;
  taskCount: number;
  questTaskCount: number;
  unestimatedCount: number;
};

export function projectDay(tasks: readonly PlannableTask[]): DayProjection {
  let questMinutes = 0;
  let adminMinutes = 0;
  let questTaskCount = 0;
  let unestimatedCount = 0;

  for (const task of tasks) {
    if (task.questId !== null) questTaskCount += 1;

    if (task.estimateMinutes === null) {
      unestimatedCount += 1;
      continue;
    }

    if (task.questId === null) adminMinutes += task.estimateMinutes;
    else questMinutes += task.estimateMinutes;
  }

  const plannedMinutes = questMinutes + adminMinutes;
  const taskCount = tasks.length;

  const basis: SplitBasis =
    plannedMinutes > 0 ? "estimates" : taskCount > 0 ? "tasks" : "empty";

  const questShare =
    basis === "estimates"
      ? share(questMinutes, plannedMinutes)
      : share(questTaskCount, taskCount);

  return {
    plannedMinutes,
    questMinutes,
    adminMinutes,
    questShare,
    adminShare: basis === "empty" ? 0 : 1 - questShare,
    basis,
    taskCount,
    questTaskCount,
    unestimatedCount,
  };
}

/** What the day actually cost, split the same way the projection is. */
export type TrackedSplit = {
  totalMinutes: number;
  questMinutes: number;
  adminMinutes: number;
};

export function trackDay(
  tasks: readonly { questId: string | null; trackedMinutes: number }[],
): TrackedSplit {
  let questMinutes = 0;
  let adminMinutes = 0;

  for (const task of tasks) {
    if (task.questId === null) adminMinutes += task.trackedMinutes;
    else questMinutes += task.trackedMinutes;
  }

  return { totalMinutes: questMinutes + adminMinutes, questMinutes, adminMinutes };
}

/**
 * How full the day is. `over` is the one that matters — Sunsama's core honesty
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
