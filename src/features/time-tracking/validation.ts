import { z } from "zod";
import { dateKeyField } from "../tasks/validation";

export const startTimerSchema = z.object({ taskId: z.uuid() });

/**
 * The Clockify-style quick start: name what you're working on, pick a quest,
 * and go — without first creating a task by hand. It becomes a task under the
 * hood, because every time entry hangs off one (PRODUCT_PLAN 0.4).
 */
export const startQuickTimerSchema = z.object({
  title: z.string().trim().min(1, "What are you working on?").max(200),
  questId: z.uuid().nullable().default(null),
  /** Which day the task lands on. Defaults to today in the user's zone. */
  dateKey: dateKeyField.optional(),
});

export type StartQuickTimerInput = z.input<typeof startQuickTimerSchema>;

export const logTimeSchema = z.object({
  taskId: z.uuid(),
  minutes: z.number().int().min(1, "Log at least a minute.").max(24 * 60),
  /** Which day the time belongs to. Defaults to today in the user's zone. */
  dateKey: dateKeyField.optional(),
});

export const adjustEntrySchema = z.object({
  entryId: z.uuid(),
  minutes: z.number().int().min(0).max(24 * 60),
});

export type LogTimeInput = z.infer<typeof logTimeSchema>;
export type AdjustEntryInput = z.infer<typeof adjustEntrySchema>;
