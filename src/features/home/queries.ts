import "server-only";
import { questColorHex } from "@/lib/quest-colors";
import {
  type DateKey,
  rollingDayKeys,
  todayKey,
  trailingWeekKeys,
} from "@/lib/time";
import {
  type QuestMeta,
  type SplitSummary,
  type TimeContext,
  type TrendPoint,
  summariseSplit,
  targetProgress,
  timeContext,
  weeklyTrend,
} from "@/features/insights/domain";
import { type QuestWithStats, listQuestsWithStats } from "@/features/quests/queries";
import { summariseDay } from "@/features/tasks/domain";
import type { DaySummary } from "@/features/tasks/domain";
import { listNextTaskPerQuest, listTasksInRange } from "@/features/tasks/queries";

/**
 * Everything Home shows, in one pass: two reads, then pure aggregation.
 *
 * Home is where Insights went (REDESIGN §4) — the payoff number should meet you
 * on arrival rather than be a page you remember to visit. Adding a new cut of
 * the data means adding a function to `insights/domain.ts`, not another query.
 */

export const TREND_WEEKS = 4;

/**
 * The headline window. Rolling rather than calendar, so the number means the
 * same thing on a Monday morning as on a Friday night — see `rollingDayKeys`.
 */
export const WINDOW_DAYS = 7;

/** A quest that this week has quietly ignored. */
export type Alert = {
  questId: string;
  name: string;
  color: string;
  reason: string;
};

export type HomeOverview = {
  todayKey: DateKey;
  weekLabel: string;
  /** This week's finished work, split quest vs. admin. */
  week: SplitSummary;
  context: TimeContext;
  trend: TrendPoint[];
  today: DaySummary;
  todayByQuest: { name: string; color: string | null; minutes: number }[];
  quests: QuestWithStats[];
  nextTaskByQuest: Map<string, string>;
  alerts: Alert[];
  hasAnyData: boolean;
};

export async function getHomeOverview(
  userId: string,
  timeZone: string,
  now: Date = new Date(),
): Promise<HomeOverview> {
  const week = rollingDayKeys(WINDOW_DAYS, timeZone, now);
  const weeks = trailingWeekKeys(TREND_WEEKS, timeZone, now);
  const today = todayKey(timeZone, now);

  // One read over whichever window is wider, then sliced in memory — the trend
  // reaches back further than the current week does.
  const fromKey = weeks[0].fromKey < week.fromKey ? weeks[0].fromKey : week.fromKey;

  const [tasks, quests, nextTaskByQuest] = await Promise.all([
    listTasksInRange(userId, fromKey, week.toKey),
    listQuestsWithStats(userId, week, { lifecycle: ["active"] }),
    listNextTaskPerQuest(userId),
  ]);

  const questsById: ReadonlyMap<string, QuestMeta> = new Map(
    quests.map((quest) => [
      quest.id,
      { id: quest.id, name: quest.name, color: questColorHex(quest.color) },
    ]),
  );

  const weekDays = new Set<string>(week.dateKeys);
  const weekTasks = tasks.filter(
    (task) => task.plannedDate !== null && weekDays.has(task.plannedDate),
  );
  const todayTasks = tasks.filter((task) => task.plannedDate === today);

  const summary = summariseSplit(weekTasks, questsById);

  return {
    todayKey: today,
    weekLabel: `Last ${WINDOW_DAYS} days`,
    week: summary,
    context: timeContext(summary),
    trend: weeklyTrend(tasks, weeks, questsById),
    today: summariseDay(todayTasks),
    todayByQuest: groupTodayByQuest(todayTasks),
    quests,
    nextTaskByQuest,
    alerts: alertsFor(quests),
    hasAnyData: tasks.length > 0,
  };
}

/** Today's plan as one line per quest — the "what is today about" card. */
function groupTodayByQuest(
  tasks: readonly {
    questId: string | null;
    questName: string | null;
    questColor: string | null;
    estimateMinutes: number | null;
  }[],
): { name: string; color: string | null; minutes: number }[] {
  const byQuest = new Map<string | null, { name: string; color: string | null; minutes: number }>();

  for (const task of tasks) {
    const key = task.questId;
    const current = byQuest.get(key) ?? {
      name: task.questName ?? "Admin",
      color: task.questColor,
      minutes: 0,
    };
    current.minutes += task.estimateMinutes ?? 0;
    byQuest.set(key, current);
  }

  return [...byQuest.entries()]
    .sort(([a], [b]) => Number(a === null) - Number(b === null))
    .map(([, value]) => value);
}

/**
 * The quests this week is neglecting. Deliberately only two kinds of alert —
 * "nothing happened" and "well short of the target you set" — because a list
 * that flags everything flags nothing.
 */
function alertsFor(quests: readonly QuestWithStats[]): Alert[] {
  const alerts: Alert[] = [];

  for (const quest of quests) {
    if (quest.bankedMinutes === 0) {
      alerts.push({
        questId: quest.id,
        name: quest.name,
        color: quest.color,
        reason: `Nothing finished in ${WINDOW_DAYS} days`,
      });
      continue;
    }

    const progress = targetProgress(quest.bankedMinutes, quest.targetHoursWeek);
    if (progress !== null && progress < 0.5) {
      alerts.push({
        questId: quest.id,
        name: quest.name,
        color: quest.color,
        reason: `${(quest.bankedMinutes / 60).toFixed(1)}h of a ${quest.targetHoursWeek}h target`,
      });
    }
  }

  return alerts;
}
