"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { db } from "@/db";
import { type Task, quests, tasks } from "@/db/schema";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action";
import { revalidateWorkspace } from "@/lib/revalidate";
import { requireUser } from "@/lib/session";
import {
  type CreateTaskInput,
  type ToggleTaskInput,
  type UpdateTaskInput,
  createTaskSchema,
  reorderTasksSchema,
  toggleTaskSchema,
  updateTaskSchema,
} from "./validation";

/**
 * Mutations for tasks.
 *
 * A task's quest is just a nullable column, so "move to Admin" and "assign to
 * a quest" are the same call with a different value — which is what keeps the
 * quest picker on the task row frictionless (PRODUCT_PLAN 0.2).
 */

/** Guards against pointing a task at someone else's quest. */
async function assertOwnedQuest(
  userId: string,
  questId: string | null | undefined,
): Promise<boolean> {
  if (!questId) return true;

  const [quest] = await db
    .select({ id: quests.id })
    .from(quests)
    .where(and(eq(quests.id, questId), eq(quests.userId, userId)))
    .limit(1);

  return Boolean(quest);
}

export async function createTask(input: CreateTaskInput): Promise<ActionResult<Task>> {
  const user = await requireUser();
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  if (!(await assertOwnedQuest(user.id, parsed.data.questId))) {
    return fail("That quest no longer exists.");
  }

  const [{ highest } = { highest: null }] = await db
    .select({ highest: max(tasks.sortOrder) })
    .from(tasks)
    .where(eq(tasks.userId, user.id));

  const [task] = await db
    .insert(tasks)
    .values({
      userId: user.id,
      title: parsed.data.title,
      questId: parsed.data.questId,
      plannedDate: parsed.data.plannedDate,
      estimateMinutes: parsed.data.estimateMinutes,
      sortOrder: (highest ?? 0) + 1,
    })
    .returning();

  revalidateWorkspace();
  return ok(task);
}

export async function updateTask(input: UpdateTaskInput): Promise<ActionResult<Task>> {
  const user = await requireUser();
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  const { id, ...changes } = parsed.data;

  if ("questId" in changes && !(await assertOwnedQuest(user.id, changes.questId))) {
    return fail("That quest no longer exists.");
  }

  const [task] = await db
    .update(tasks)
    .set(changes)
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning();

  if (!task) return fail("That task no longer exists.");

  revalidateWorkspace();
  return ok(task);
}

export async function toggleTask(input: ToggleTaskInput): Promise<ActionResult<Task>> {
  const user = await requireUser();
  const parsed = toggleTaskSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  const [task] = await db
    .update(tasks)
    .set({
      done: parsed.data.done,
      completedAt: parsed.data.done ? new Date() : null,
    })
    .where(and(eq(tasks.id, parsed.data.id), eq(tasks.userId, user.id)))
    .returning();

  if (!task) return fail("That task no longer exists.");

  revalidateWorkspace();
  return ok(task);
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const user = await requireUser();

  const [deleted] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning({ id: tasks.id });

  if (!deleted) return fail("That task no longer exists.");

  revalidateWorkspace();
  return ok();
}

/**
 * Persists a new order for a list of tasks. Written as one statement per task
 * on purpose — the Neon HTTP driver has no interactive transaction, and a
 * partially applied reorder is cosmetic rather than corrupting.
 */
export async function reorderTasks(ids: string[]): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reorderTasksSchema.safeParse({ ids });
  if (!parsed.success) return failFromZod(parsed.error);

  const owned = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.userId, user.id), inArray(tasks.id, parsed.data.ids)));

  if (owned.length !== parsed.data.ids.length) {
    return fail("Some of those tasks no longer exist.");
  }

  await Promise.all(
    parsed.data.ids.map((id, index) =>
      db
        .update(tasks)
        .set({ sortOrder: index })
        .where(and(eq(tasks.id, id), eq(tasks.userId, user.id))),
    ),
  );

  revalidateWorkspace();
  return ok();
}
