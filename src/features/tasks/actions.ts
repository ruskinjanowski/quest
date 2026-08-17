"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { db } from "@/db";
import { type Task, quests, tasks } from "@/db/schema";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action";
import { revalidateWorkspace } from "@/lib/revalidate";
import { requireUser } from "@/lib/session";
import {
  type CreateTaskInput,
  type MoveTaskInput,
  type ToggleTaskInput,
  type UpdateTaskInput,
  createTaskSchema,
  moveTaskSchema,
  reorderTasksSchema,
  toggleTaskSchema,
  updateTaskSchema,
} from "./validation";

/**
 * Mutations for tasks.
 *
 * A task's quest is just a nullable column, so "move to Admin" and "assign to
 * a quest" are the same call with a different value — which is what keeps the
 * quest picker on the task card frictionless (PRODUCT_PLAN 0.2).
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
      notes: parsed.data.notes,
      questId: parsed.data.questId,
      plannedDate: parsed.data.plannedDate,
      estimateMinutes: parsed.data.estimateMinutes,
      // Captured straight into the backlog? It belongs to a horizon; on a day
      // it doesn't, and carrying a stale one would resurface it on unschedule.
      horizon: parsed.data.plannedDate === null ? (parsed.data.horizon ?? "week") : null,
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

  // Scheduling a task settles the "when" question the horizon was asking, and
  // sending it back to the backlog re-opens it.
  const withHorizon =
    "plannedDate" in changes && !("horizon" in changes)
      ? { ...changes, horizon: changes.plannedDate === null ? ("week" as const) : null }
      : changes;

  const [task] = await db
    .update(tasks)
    .set(withHorizon)
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning();

  if (!task) return fail("That task no longer exists.");

  revalidateWorkspace();
  return ok(task);
}

/**
 * Ticking a task off, and banking what it cost in the same gesture.
 *
 * `actualMinutes` arrives pre-filled with the estimate from the checkbox, so
 * the honest path is one click; correcting it afterwards is the second click
 * on the detail panel. Un-ticking clears the actual — a task that isn't done
 * hasn't cost anything yet.
 */
export async function toggleTask(input: ToggleTaskInput): Promise<ActionResult<Task>> {
  const user = await requireUser();
  const parsed = toggleTaskSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  const { id, done, actualMinutes } = parsed.data;

  const [task] = await db
    .update(tasks)
    .set({
      done,
      completedAt: done ? new Date() : null,
      ...(done ? (actualMinutes === undefined ? {} : { actualMinutes }) : { actualMinutes: null }),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
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

  if (!(await ownsAll(user.id, parsed.data.ids))) {
    return fail("Some of those tasks no longer exist.");
  }

  await writeOrder(user.id, parsed.data.ids);

  revalidateWorkspace();
  return ok();
}

/**
 * A drop: the task's new day (or the backlog, and which bucket of it) plus the
 * destination list's new order, in one call. Both halves of the gesture land
 * together, so the board never renders a task in the right column at the wrong
 * position while a second request is in flight.
 */
export async function moveTask(input: MoveTaskInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  const { id, plannedDate, horizon, orderedIds } = parsed.data;

  if (!(await ownsAll(user.id, [...new Set([id, ...orderedIds])]))) {
    return fail("Some of those tasks no longer exist.");
  }

  const [moved] = await db
    .update(tasks)
    .set({
      plannedDate,
      horizon: plannedDate === null ? (horizon ?? "week") : null,
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning({ id: tasks.id });

  if (!moved) return fail("That task no longer exists.");

  await writeOrder(user.id, orderedIds);

  revalidateWorkspace();
  return ok();
}

async function ownsAll(userId: string, ids: readonly string[]): Promise<boolean> {
  const owned = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), inArray(tasks.id, [...ids])));

  return owned.length === ids.length;
}

function writeOrder(userId: string, ids: readonly string[]): Promise<unknown> {
  return Promise.all(
    ids.map((id, index) =>
      db
        .update(tasks)
        .set({ sortOrder: index })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId))),
    ),
  );
}
