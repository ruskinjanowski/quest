"use server";

import { and, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { type Quest, quests } from "@/db/schema";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action";
import { nextQuestColor } from "@/lib/quest-colors";
import { revalidateWorkspace } from "@/lib/revalidate";
import { requireUser } from "@/lib/session";
import { listUsedQuestColors } from "./queries";
import {
  type CreateQuestInput,
  type SetQuestLifecycleInput,
  type UpdateQuestInput,
  createQuestSchema,
  setQuestLifecycleSchema,
  updateQuestSchema,
} from "./validation";

/**
 * Mutations for quests.
 *
 * Two rules hold for every action in the app:
 * 1. The user id comes from the session, never from the caller.
 * 2. Every write is scoped by that user id, so an id guessed from a URL
 *    updates nothing rather than someone else's row.
 */

export async function createQuest(
  input: CreateQuestInput,
): Promise<ActionResult<Quest>> {
  const user = await requireUser();
  const parsed = createQuestSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  const [{ highest } = { highest: null }] = await db
    .select({ highest: max(quests.sortOrder) })
    .from(quests)
    .where(eq(quests.userId, user.id));

  const color = parsed.data.color ?? nextQuestColor(await listUsedQuestColors(user.id));

  const [quest] = await db
    .insert(quests)
    .values({
      userId: user.id,
      name: parsed.data.name,
      color,
      targetHoursWeek: parsed.data.targetHoursWeek ?? null,
      sortOrder: (highest ?? 0) + 1,
    })
    .returning();

  revalidateWorkspace();
  return ok(quest);
}

export async function updateQuest(
  input: UpdateQuestInput,
): Promise<ActionResult<Quest>> {
  const user = await requireUser();
  const parsed = updateQuestSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  const { id, ...changes } = parsed.data;

  const [quest] = await db
    .update(quests)
    .set(changes)
    .where(and(eq(quests.id, id), eq(quests.userId, user.id)))
    .returning();

  if (!quest) return fail("That quest no longer exists.");

  revalidateWorkspace();
  return ok(quest);
}

/**
 * Lifecycle is separate from health on purpose: completing a quest is the
 * payoff moment and changes whether it counts in Insights.
 */
export async function setQuestLifecycle(
  input: SetQuestLifecycleInput,
): Promise<ActionResult<Quest>> {
  const user = await requireUser();
  const parsed = setQuestLifecycleSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  const [quest] = await db
    .update(quests)
    .set({
      lifecycle: parsed.data.lifecycle,
      completedAt: parsed.data.lifecycle === "completed" ? new Date() : null,
    })
    .where(and(eq(quests.id, parsed.data.id), eq(quests.userId, user.id)))
    .returning();

  if (!quest) return fail("That quest no longer exists.");

  revalidateWorkspace();
  return ok(quest);
}

/**
 * Deleting a quest keeps its tasks — `tasks.quest_id` is set to null, which
 * moves them into Admin rather than destroying tracked history.
 */
export async function deleteQuest(id: string): Promise<ActionResult> {
  const user = await requireUser();

  const [deleted] = await db
    .delete(quests)
    .where(and(eq(quests.id, id), eq(quests.userId, user.id)))
    .returning({ id: quests.id });

  if (!deleted) return fail("That quest no longer exists.");

  revalidateWorkspace();
  return ok();
}
