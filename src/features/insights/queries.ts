import "server-only";
import { questColorHex } from "@/lib/quest-colors";
import {
  type DateRange,
  type Timeframe,
  formatRangeLabel,
  rangeForTimeframe,
  trailingWeeks,
  weekRange,
} from "@/lib/time";
import { listQuests } from "../quests/queries";
import { listEntriesInRange } from "../time-tracking/queries";
import {
  type QuestMeta,
  type SplitSummary,
  type TimeContext,
  type TrendPoint,
  summariseSplit,
  timeContext,
  weeklyTrend,
} from "./domain";

/**
 * Assembles everything the Insights page shows in one pass: two reads, then
 * pure aggregation. Adding a new cut of the data means adding a function in
 * `domain.ts`, not another query.
 */

export const TREND_WEEKS = 4;

export type InsightsData = {
  timeframe: Timeframe;
  range: DateRange;
  rangeLabel: string;
  summary: SplitSummary;
  context: TimeContext;
  trend: TrendPoint[];
  hasAnyData: boolean;
};

async function buildQuestLookup(
  userId: string,
  includeCompleted: boolean,
): Promise<ReadonlyMap<string, QuestMeta>> {
  const rows = await listQuests(userId, {
    lifecycle: includeCompleted ? ["active", "completed", "archived"] : ["active"],
  });

  return new Map(
    rows.map((quest) => [
      quest.id,
      { id: quest.id, name: quest.name, color: questColorHex(quest.color) } satisfies QuestMeta,
    ]),
  );
}

export async function getInsights(
  userId: string,
  options: {
    timeframe: Timeframe;
    timeZone: string;
    /** PRODUCT_PLAN open question 7: the window and the set are separate controls. */
    includeCompleted?: boolean;
    now?: Date;
  },
): Promise<InsightsData> {
  const { timeframe, timeZone, includeCompleted = false, now = new Date() } = options;

  const range = rangeForTimeframe(timeframe, timeZone, now);
  const weeks = trailingWeeks(TREND_WEEKS, timeZone, now);
  // Read once over whichever window is wider, then slice it in memory.
  const readRange: DateRange = {
    start: range.start < weeks[0].start ? range.start : weeks[0].start,
    end: range.end,
  };

  const [entries, questsById] = await Promise.all([
    listEntriesInRange(userId, readRange),
    buildQuestLookup(userId, includeCompleted),
  ]);

  const summary = summariseSplit(entries, range, questsById, now);
  const weeksInRange = weeksSpanned(range, timeZone, now);

  return {
    timeframe,
    range,
    rangeLabel:
      timeframe === "all" ? "All time" : formatRangeLabel(range, timeZone),
    summary,
    context: timeContext(summary, weeksInRange),
    trend: weeklyTrend(entries, weeks, questsById, now),
    hasAnyData: entries.length > 0,
  };
}

/** How many weeks the range covers, for the "% of your week" denominator. */
function weeksSpanned(range: DateRange, timeZone: string, now: Date): number {
  const oneWeek = weekRange(timeZone, now);
  const weekMs = oneWeek.end.getTime() - oneWeek.start.getTime();
  const spanMs = Math.min(range.end.getTime(), now.getTime()) - range.start.getTime();

  return Math.max(1, Math.round(spanMs / weekMs));
}

/** The header counter (PRODUCT_PLAN 1.1) — today's split, nothing else. */
export async function getTodaySplit(
  userId: string,
  dayRange: DateRange,
  now: Date = new Date(),
): Promise<SplitSummary> {
  const [entries, questsById] = await Promise.all([
    listEntriesInRange(userId, dayRange),
    buildQuestLookup(userId, true),
  ]);

  return summariseSplit(entries, dayRange, questsById, now);
}
