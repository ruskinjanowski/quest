import "server-only";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { type Quest, quests, tasks } from "@/db/schema";
import type { DateRange } from "@/lib/time";
import { entryMinutesInRange } from "../time-tracking/domain";
import { listEntriesInRange } from "../time-tracking/queries";

export type QuestWithStats = Quest & {
  trackedMinutes: number;
  openTaskCount: number;
};

export async function listQuests(
  userId: string,
  options: { lifecycle?: Quest["lifecycle"][] } = {},
): Promise<Quest[]> {
  const filters = [eq(quests.userId, userId)];
  if (options.lifecycle?.length) {
    filters.push(inArray(quests.lifecycle, options.lifecycle));
  }

  return db
    .select()
    .from(quests)
    .where(and(...filters))
    .orderBy(asc(quests.sortOrder), asc(quests.createdAt));
}

export function listActiveQuests(userId: string): Promise<Quest[]> {
  return listQuests(userId, { lifecycle: ["active"] });
}

export async function getQuest(userId: string, questId: string): Promise<Quest | null> {
  const [quest] = await db
    .select()
    .from(quests)
    .where(and(eq(quests.userId, userId), eq(quests.id, questId)))
    .limit(1);

  return quest ?? null;
}

/**
 * Quests decorated with the two numbers the list and detail pages show.
 * Tracked minutes are aggregated in TypeScript from raw entries rather than in
 * SQL: it reuses the same pure `entryMinutesInRange` the charts use, so a
 * running timer is counted identically everywhere.
 */
export async function listQuestsWithStats(
  userId: string,
  range: DateRange,
  options: { lifecycle?: Quest["lifecycle"][] } = {},
): Promise<QuestWithStats[]> {
  const [questRows, entries, openTaskRows] = await Promise.all([
    listQuests(userId, options),
    listEntriesInRange(userId, range),
    db
      .select({ questId: tasks.questId, openTasks: count() })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.done, false)))
      .groupBy(tasks.questId),
  ]);

  const now = new Date();
  const minutesByQuest = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.questId) continue;
    minutesByQuest.set(
      entry.questId,
      (minutesByQuest.get(entry.questId) ?? 0) + entryMinutesInRange(entry, range, now),
    );
  }

  const openByQuest = new Map(
    openTaskRows
      .filter((row): row is { questId: string; openTasks: number } => row.questId !== null)
      .map((row) => [row.questId, row.openTasks]),
  );

  return questRows.map((quest) => ({
    ...quest,
    trackedMinutes: minutesByQuest.get(quest.id) ?? 0,
    openTaskCount: openByQuest.get(quest.id) ?? 0,
  }));
}

/** Per-week hours for one quest — the "simple history" on the detail page. */
export async function getQuestHistory(
  userId: string,
  questId: string,
  weeks: readonly (DateRange & { label: string })[],
): Promise<{ label: string; minutes: number }[]> {
  if (weeks.length === 0) return [];

  const entries = await listEntriesInRange(userId, {
    start: weeks[0].start,
    end: weeks[weeks.length - 1].end,
  });

  const questEntries = entries.filter((entry) => entry.questId === questId);
  const now = new Date();

  return weeks.map((week) => ({
    label: week.label,
    minutes: questEntries.reduce(
      (sum, entry) => sum + entryMinutesInRange(entry, week, now),
      0,
    ),
  }));
}

/** Used to pick a distinct colour for the next quest. */
export async function listUsedQuestColors(userId: string): Promise<string[]> {
  const rows = await db
    .select({ color: quests.color })
    .from(quests)
    .where(eq(quests.userId, userId));

  return rows.map((row) => row.color);
}
