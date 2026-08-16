"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { type TimeEntry, tasks, timeEntries } from "@/db/schema";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action";
import { revalidateWorkspace } from "@/lib/revalidate";
import { requireUser } from "@/lib/session";
import { MS_PER_MINUTE, entryMinutes, isRunning } from "./domain";
import { listEntriesForTask } from "./queries";
import { dayRange, todayKey } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";
import { createTask } from "../tasks/actions";
import {
  type AdjustEntryInput,
  type LogTimeInput,
  type StartQuickTimerInput,
  adjustEntrySchema,
  logTimeSchema,
  startQuickTimerSchema,
  startTimerSchema,
} from "./validation";

/**
 * Timer and manual-entry mutations.
 *
 * "One running timer at a time" (PRODUCT_PLAN §5) is implemented as
 * stop-then-start, and backed by the partial unique index on
 * `time_entries (user_id) where ended_at is null` — the HTTP driver gives us no
 * interactive transaction, so the database is what actually holds the rule.
 */

async function assertOwnedTask(userId: string, taskId: string): Promise<boolean> {
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .limit(1);

  return Boolean(task);
}

/** Closes any running entry. Safe to call when nothing is running. */
async function stopRunningEntries(userId: string, at: Date): Promise<void> {
  await db
    .update(timeEntries)
    .set({ endedAt: at })
    .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endedAt)));
}

export async function startTimer(taskId: string): Promise<ActionResult<TimeEntry>> {
  const user = await requireUser();
  const parsed = startTimerSchema.safeParse({ taskId });
  if (!parsed.success) return failFromZod(parsed.error);

  if (!(await assertOwnedTask(user.id, parsed.data.taskId))) {
    return fail("That task no longer exists.");
  }

  const now = new Date();
  // Starting a second timer stops the first — the product decision, not a bug.
  await stopRunningEntries(user.id, now);

  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId: user.id,
      taskId: parsed.data.taskId,
      source: "timer",
      startedAt: now,
    })
    .returning();

  revalidateWorkspace();
  return ok(entry);
}

/**
 * Start a timer on a brand-new task in one step (the timer-first entry point on
 * Today). Composes the existing task and timer paths rather than re-deriving
 * quest ownership or sort order: `createTask` already guards both, and
 * `startTimer` already enforces the one-running-timer rule.
 */
export async function startQuickTimer(
  input: StartQuickTimerInput,
): Promise<ActionResult<TimeEntry>> {
  const parsed = startQuickTimerSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  const timeZone = await getTimeZone();

  const created = await createTask({
    title: parsed.data.title,
    questId: parsed.data.questId,
    plannedDate: parsed.data.dateKey ?? todayKey(timeZone),
  });
  if (!created.ok) return created;

  return startTimer(created.data.id);
}

export async function stopTimer(): Promise<ActionResult> {
  const user = await requireUser();
  await stopRunningEntries(user.id, new Date());

  revalidateWorkspace();
  return ok();
}

/**
 * Manual entry — the fallback for a forgotten timer, and how demo data gets
 * staged. `endedAt` is filled in so range queries can treat every row alike,
 * but `durationMinutes` stays the source of truth.
 */
export async function logTime(input: LogTimeInput): Promise<ActionResult<TimeEntry>> {
  const user = await requireUser();
  const parsed = logTimeSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  if (!(await assertOwnedTask(user.id, parsed.data.taskId))) {
    return fail("That task no longer exists.");
  }

  const timeZone = await getTimeZone();
  const dateKey = parsed.data.dateKey ?? todayKey(timeZone);
  const startedAt = dayRange(dateKey, timeZone).start;

  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId: user.id,
      taskId: parsed.data.taskId,
      source: "manual",
      startedAt,
      endedAt: new Date(startedAt.getTime() + parsed.data.minutes * MS_PER_MINUTE),
      durationMinutes: parsed.data.minutes,
    })
    .returning();

  revalidateWorkspace();
  return ok(entry);
}

/**
 * Tracked time is editable after the fact (PRODUCT_PLAN §5). Adjusting turns
 * the entry into a manual one, since its wall-clock window no longer describes it.
 */
export async function adjustEntry(
  input: AdjustEntryInput,
): Promise<ActionResult<TimeEntry>> {
  const user = await requireUser();
  const parsed = adjustEntrySchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);

  const [entry] = await db
    .update(timeEntries)
    .set({
      source: "manual",
      durationMinutes: parsed.data.minutes,
      endedAt: sql`${timeEntries.startedAt} + make_interval(mins => ${parsed.data.minutes})`,
    })
    .where(and(eq(timeEntries.id, parsed.data.entryId), eq(timeEntries.userId, user.id)))
    .returning();

  if (!entry) return fail("That time entry no longer exists.");

  revalidateWorkspace();
  return ok(entry);
}

/**
 * A task's individual entries, for the "edit tracked time" dialog. A read, but
 * exposed as an action so a client component can fetch it on demand rather than
 * every task row shipping its full entry history up front. Minutes are computed
 * here (running timers count to now) so the client renders a plain number.
 */
export type TaskEntrySummary = {
  id: string;
  source: "timer" | "manual";
  /** ISO. */
  startedAt: string;
  running: boolean;
  minutes: number;
};

export async function getTaskEntries(
  taskId: string,
): Promise<ActionResult<TaskEntrySummary[]>> {
  const user = await requireUser();
  const rows = await listEntriesForTask(user.id, taskId);
  const now = new Date();

  return ok(
    rows.map((row) => ({
      id: row.id,
      source: row.source,
      startedAt: row.startedAt.toISOString(),
      running: isRunning(row),
      minutes: Math.round(entryMinutes(row, now)),
    })),
  );
}

export async function deleteEntry(entryId: string): Promise<ActionResult> {
  const user = await requireUser();

  const [deleted] = await db
    .delete(timeEntries)
    .where(and(eq(timeEntries.id, entryId), eq(timeEntries.userId, user.id)))
    .returning({ id: timeEntries.id });

  if (!deleted) return fail("That time entry no longer exists.");

  revalidateWorkspace();
  return ok();
}
