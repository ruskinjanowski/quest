import { z } from "zod";
import type { TaskHorizon } from "@/db/schema";
import { TASK_HORIZONS } from "./horizons";

/** `questId: null` is the Admin bucket, everywhere. */
export const questIdField = z.uuid().nullable();

export const dateKeyField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a yyyy-MM-dd date.");

/** Derived from the bucket list so the two can't drift apart. */
export const horizonField = z.enum(
  TASK_HORIZONS.map((horizon) => horizon.value) as [TaskHorizon, ...TaskHorizon[]],
);

/** A note is optional; an empty string is stored as null so "no note" is one value. */
const notesField = z
  .string()
  .trim()
  .max(2000)
  .transform((value) => (value.length > 0 ? value : null))
  .nullable();

/** Minutes, as `PLANNED` and `ACTUAL` both take them. Null clears the field. */
const minutesField = z
  .number()
  .int()
  .min(1)
  .max(24 * 60)
  .nullable();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title.").max(200),
  notes: notesField.default(null),
  questId: questIdField.default(null),
  plannedDate: dateKeyField.nullable().default(null),
  estimateMinutes: minutesField.default(null),
  horizon: horizonField.nullable().default(null),
});

export const updateTaskSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, "Give the task a title.").max(200).optional(),
  notes: notesField.optional(),
  questId: questIdField.optional(),
  plannedDate: dateKeyField.nullable().optional(),
  estimateMinutes: minutesField.optional(),
  actualMinutes: minutesField.optional(),
  horizon: horizonField.nullable().optional(),
});

export const toggleTaskSchema = z.object({
  id: z.uuid(),
  done: z.boolean(),
  /**
   * What it actually took. Sent when the checkbox banks the estimate on
   * completion, so "tick it off" and "record the time" stay one gesture.
   */
  actualMinutes: minutesField.optional(),
});

export const reorderTasksSchema = z.object({
  /** Task ids in their new order. */
  ids: z.array(z.uuid()).min(1),
});

/**
 * A drag: where the task landed, and the full new order of the list it landed
 * in. Destination and order travel together because a drop changes both, and
 * two round trips would let the board show a task in the right column at the
 * wrong position.
 */
export const moveTaskSchema = z.object({
  id: z.uuid(),
  /** `null` drops it into the backlog. */
  plannedDate: dateKeyField.nullable(),
  horizon: horizonField.nullable().default(null),
  orderedIds: z.array(z.uuid()).min(1),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;
export type MoveTaskInput = z.input<typeof moveTaskSchema>;
