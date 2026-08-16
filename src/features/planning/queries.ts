import "server-only";
import { and, asc, eq, gt, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { quests, tasks, timeEntries } from "@/db/schema";
import { type DateKey, dayRange } from "@/lib/time";
import { entryMinutes } from "../time-tracking/domain";

/**
 * Reads for the day's shape. The timeline shows what *actually* happened —
 * tracked time positioned on a clock — rather than a plan, because tasks carry
 * an estimate but no time of day (PRODUCT_PLAN leaves real timeboxing to a
 * later phase). That keeps the column honest: it is the day as recorded.
 */

export type DayBlock = {
  id: string;
  title: string;
  questId: string | null;
  questColor: string | null;
  /** Minutes from local midnight, clamped to the day. */
  startMinute: number;
  endMinute: number;
  running: boolean;
};

const MINUTES_PER_DAY = 24 * 60;

export async function listDayBlocks(
  userId: string,
  dateKey: DateKey,
  timeZone: string,
  now: Date = new Date(),
): Promise<DayBlock[]> {
  const range = dayRange(dateKey, timeZone);

  const rows = await db
    .select({
      id: timeEntries.id,
      title: tasks.title,
      questId: tasks.questId,
      questColor: quests.color,
      source: timeEntries.source,
      startedAt: timeEntries.startedAt,
      endedAt: timeEntries.endedAt,
      durationMinutes: timeEntries.durationMinutes,
    })
    .from(timeEntries)
    .innerJoin(tasks, eq(tasks.id, timeEntries.taskId))
    .leftJoin(quests, eq(quests.id, tasks.questId))
    .where(
      and(
        eq(timeEntries.userId, userId),
        lt(timeEntries.startedAt, range.end),
        or(isNull(timeEntries.endedAt), gt(timeEntries.endedAt, range.start)),
      ),
    )
    .orderBy(asc(timeEntries.startedAt));

  return rows.map((row) => {
    const offset = (row.startedAt.getTime() - range.start.getTime()) / 60_000;
    const startMinute = Math.max(0, Math.min(MINUTES_PER_DAY, offset));
    const length = entryMinutes(row, now);

    return {
      id: row.id,
      title: row.title,
      questId: row.questId,
      questColor: row.questColor,
      startMinute,
      endMinute: Math.min(MINUTES_PER_DAY, startMinute + length),
      running: row.source === "timer" && row.endedAt === null,
    };
  });
}
