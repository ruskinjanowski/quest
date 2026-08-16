import { z } from "zod";

/** `questId: null` is the Admin bucket, everywhere. */
export const questIdField = z.uuid().nullable();

export const dateKeyField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a yyyy-MM-dd date.");

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title.").max(200),
  questId: questIdField.default(null),
  plannedDate: dateKeyField.nullable().default(null),
  estimateMinutes: z.number().int().min(1).max(24 * 60).nullable().default(null),
});

export const updateTaskSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, "Give the task a title.").max(200).optional(),
  questId: questIdField.optional(),
  plannedDate: dateKeyField.nullable().optional(),
  estimateMinutes: z.number().int().min(1).max(24 * 60).nullable().optional(),
});

export const toggleTaskSchema = z.object({
  id: z.uuid(),
  done: z.boolean(),
});

export const reorderTasksSchema = z.object({
  /** Task ids in their new order. */
  ids: z.array(z.uuid()).min(1),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;
