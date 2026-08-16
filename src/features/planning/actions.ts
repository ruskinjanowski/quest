"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { quests, tasks } from "@/db/schema";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action";
import { revalidateWorkspace } from "@/lib/revalidate";
import { requireUser } from "@/lib/session";
import { type PlanDayInput, planDaySchema } from "./validation";

/**
 * Commits a planned day: which tasks are on it, what quest each advances, and
 * how long each is expected to take.
 *
 * Written as one update per task and not a transaction on purpose — the Neon
 * HTTP driver has no interactive transactions (CLAUDE.md), and every task is
 * validated as owned *before* any write, so the only failure left is a network
 * one, whose worst case is a partially planned day the user can simply re-plan.
 */
export async function planDay(input: PlanDayInput): Promise<ActionResult<number>> {
  const user = await requireUser();
  const parsed = planDaySchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  const { dateKey, tasks: items } = parsed.data;
  if (items.length === 0) {
    revalidateWorkspace();
    return ok(0);
  }

  const ids = items.map((item) => item.id);
  const questIds = [
    ...new Set(items.map((item) => item.questId).filter((id): id is string => id !== null)),
  ];

  const [owned, ownedQuests] = await Promise.all([
    db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), inArray(tasks.id, ids))),
    questIds.length === 0
      ? Promise.resolve([])
      : db
          .select({ id: quests.id })
          .from(quests)
          .where(and(eq(quests.userId, user.id), inArray(quests.id, questIds))),
  ]);

  if (owned.length !== new Set(ids).size) {
    return fail("Some of those tasks no longer exist.");
  }

  if (ownedQuests.length !== questIds.length) {
    return fail("One of those quests no longer exists.");
  }

  await Promise.all(
    items.map((item, index) =>
      db
        .update(tasks)
        .set({
          // `undefined` is skipped by Drizzle, which is exactly the "leave it
          // where it is" case the schema describes.
          plannedDate: item.plannedDate,
          questId: item.questId,
          estimateMinutes: item.estimateMinutes,
          // The order they were arranged in during planning is the order the
          // day should be worked in.
          sortOrder: index,
        })
        .where(and(eq(tasks.id, item.id), eq(tasks.userId, user.id))),
    ),
  );

  revalidateWorkspace();
  return ok(items.filter((item) => item.plannedDate === dateKey).length);
}
