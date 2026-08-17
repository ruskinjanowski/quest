import { share } from "@/lib/duration";
import { type TimedTask, costOf } from "@/features/tasks/domain";

/**
 * The payoff screen's arithmetic, as pure functions.
 *
 * Nothing here touches the database or React, so the numbers behind the Loom's
 * headline claim can be reasoned about — and tested — on their own. Splits and
 * percentages are never stored; they are always derived from the tasks
 * themselves (CLAUDE.md rule 4).
 */

export type TaskForSplit = TimedTask & { plannedDate: string | null };

export type QuestMeta = { id: string; name: string; color: string };

export type QuestSlice = {
  /** `null` is the Admin bucket. */
  questId: string | null;
  name: string;
  color: string;
  minutes: number;
  /** Fraction of all banked time in the range. */
  share: number;
};

export type SplitSummary = {
  questMinutes: number;
  adminMinutes: number;
  totalMinutes: number;
  questShare: number;
  adminShare: number;
  /** Per-quest, biggest first. Admin is excluded — it gets its own number. */
  perQuest: QuestSlice[];
};

export const ADMIN_LABEL = "Admin";

/** Hours in a week — the honest, provocative denominator (PRODUCT_PLAN 1.8). */
export const HOURS_IN_WEEK = 168;

/**
 * Splits finished work by quest. Only `done` tasks count: an unfinished task is
 * an intention, and the whole point of the number is that it reports what
 * actually happened.
 */
export function summariseSplit(
  tasks: readonly TaskForSplit[],
  questsById: ReadonlyMap<string, QuestMeta>,
): SplitSummary {
  const minutesByQuest = new Map<string | null, number>();

  for (const task of tasks) {
    if (!task.done) continue;

    const minutes = costOf(task);
    if (minutes <= 0) continue;

    const key = task.questId && questsById.has(task.questId) ? task.questId : null;
    minutesByQuest.set(key, (minutesByQuest.get(key) ?? 0) + minutes);
  }

  const adminMinutes = minutesByQuest.get(null) ?? 0;
  let questMinutes = 0;
  for (const [questId, minutes] of minutesByQuest) {
    if (questId !== null) questMinutes += minutes;
  }

  const totalMinutes = questMinutes + adminMinutes;

  const perQuest: QuestSlice[] = [];
  for (const [questId, minutes] of minutesByQuest) {
    if (questId === null) continue;
    const meta = questsById.get(questId);
    if (!meta) continue;

    perQuest.push({
      questId,
      name: meta.name,
      color: meta.color,
      minutes,
      share: share(minutes, totalMinutes),
    });
  }
  perQuest.sort((a, b) => b.minutes - a.minutes);

  return {
    questMinutes,
    adminMinutes,
    totalMinutes,
    questShare: share(questMinutes, totalMinutes),
    adminShare: share(adminMinutes, totalMinutes),
    perQuest,
  };
}

export type TrendPoint = {
  label: string;
  questMinutes: number;
  adminMinutes: number;
};

/** One point per week — "did my time match my ambitions" over time. */
export function weeklyTrend(
  tasks: readonly TaskForSplit[],
  weeks: readonly { label: string; dateKeys: readonly string[] }[],
  questsById: ReadonlyMap<string, QuestMeta>,
): TrendPoint[] {
  return weeks.map((week) => {
    const days = new Set(week.dateKeys);
    const summary = summariseSplit(
      tasks.filter((task) => task.plannedDate !== null && days.has(task.plannedDate)),
      questsById,
    );

    return {
      label: week.label,
      questMinutes: summary.questMinutes,
      adminMinutes: summary.adminMinutes,
    };
  });
}

export type TimeContext = {
  /** Quest hours as a share of time actually banked — flattering but easy. */
  shareOfTracked: number;
  /** Quest hours as a share of the whole week — honest and confronting. */
  shareOfWeek: number;
};

/**
 * PRODUCT_PLAN 1.8 / open question 6: ship both denominators, lead with the
 * banked share and keep the 168h framing as the subtitle.
 */
export function timeContext(summary: SplitSummary, weeksInRange = 1): TimeContext {
  return {
    shareOfTracked: summary.questShare,
    shareOfWeek: share(summary.questMinutes / 60, HOURS_IN_WEEK * Math.max(1, weeksInRange)),
  };
}

/** Progress against a quest's optional weekly target (PRODUCT_PLAN 1.3). */
export function targetProgress(
  minutes: number,
  targetHoursWeek: number | null,
): number | null {
  if (!targetHoursWeek) return null;
  return Math.min(1, minutes / 60 / targetHoursWeek);
}
