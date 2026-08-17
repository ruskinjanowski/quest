import "server-only";
import { and, asc, count, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { type Quest, quests, tasks } from "@/db/schema";
import { costOf } from "@/features/tasks/domain";
import type { DateKey } from "@/lib/time";

export type QuestWithStats = Quest & {
  /** Minutes banked on this quest in the window the caller asked about. */
  bankedMinutes: number;
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
 *
 * Minutes are aggregated in TypeScript from raw task rows rather than in SQL:
 * it reuses the same pure `costOf` the charts use, so `ACTUAL` falling back to
 * `PLANNED` behaves identically everywhere.
 */
export async function listQuestsWithStats(
  userId: string,
  range: { fromKey: DateKey; toKey: DateKey },
  options: { lifecycle?: Quest["lifecycle"][] } = {},
): Promise<QuestWithStats[]> {
  const [questRows, doneRows, openTaskRows] = await Promise.all([
    listQuests(userId, options),
    db
      .select({
        questId: tasks.questId,
        estimateMinutes: tasks.estimateMinutes,
        actualMinutes: tasks.actualMinutes,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.done, true),
          isNotNull(tasks.questId),
          isNotNull(tasks.plannedDate),
          gte(tasks.plannedDate, range.fromKey),
          lte(tasks.plannedDate, range.toKey),
        ),
      ),
    db
      .select({ questId: tasks.questId, openTasks: count() })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.done, false)))
      .groupBy(tasks.questId),
  ]);

  const minutesByQuest = new Map<string, number>();
  for (const row of doneRows) {
    if (!row.questId) continue;
    minutesByQuest.set(
      row.questId,
      (minutesByQuest.get(row.questId) ?? 0) + costOf({ ...row, questId: row.questId, done: true }),
    );
  }

  const openByQuest = new Map(
    openTaskRows
      .filter((row): row is { questId: string; openTasks: number } => row.questId !== null)
      .map((row) => [row.questId, row.openTasks]),
  );

  return questRows.map((quest) => ({
    ...quest,
    bankedMinutes: minutesByQuest.get(quest.id) ?? 0,
    openTaskCount: openByQuest.get(quest.id) ?? 0,
  }));
}

/** Per-week minutes for one quest — the "simple history" on the detail page. */
export async function getQuestHistory(
  userId: string,
  questId: string,
  weeks: readonly { label: string; dateKeys: readonly DateKey[] }[],
): Promise<{ label: string; minutes: number }[]> {
  if (weeks.length === 0) return [];

  const first = weeks[0].dateKeys[0];
  const last = weeks[weeks.length - 1].dateKeys.at(-1)!;

  const rows = await db
    .select({
      plannedDate: tasks.plannedDate,
      estimateMinutes: tasks.estimateMinutes,
      actualMinutes: tasks.actualMinutes,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.questId, questId),
        eq(tasks.done, true),
        isNotNull(tasks.plannedDate),
        gte(tasks.plannedDate, first),
        lte(tasks.plannedDate, last),
      ),
    );

  return weeks.map((week) => {
    const days = new Set<string>(week.dateKeys);
    return {
      label: week.label,
      minutes: rows
        .filter((row) => row.plannedDate !== null && days.has(row.plannedDate))
        .reduce((sum, row) => sum + costOf({ ...row, questId, done: true }), 0),
    };
  });
}

/** Used to pick a distinct colour for the next quest. */
export async function listUsedQuestColors(userId: string): Promise<string[]> {
  const rows = await db
    .select({ color: quests.color })
    .from(quests)
    .where(eq(quests.userId, userId));

  return rows.map((row) => row.color);
}
