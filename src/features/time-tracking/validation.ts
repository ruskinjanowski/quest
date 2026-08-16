import { z } from "zod";
import { dateKeyField } from "../tasks/validation";

export const startTimerSchema = z.object({ taskId: z.uuid() });

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
