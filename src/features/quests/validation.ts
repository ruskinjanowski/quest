import { z } from "zod";
import { isQuestColorKey } from "@/lib/quest-colors";

/**
 * Input contracts for the quest actions. Shared with forms so the client and
 * the server agree on what "valid" means.
 */

export const questColorSchema = z.string().refine(isQuestColorKey, {
  message: "Pick a colour from the palette.",
});

export const questLifecycleSchema = z.enum(["active", "completed", "archived"]);

export const questHealthSchema = z.enum([
  "on_track",
  "at_risk",
  "off_track",
  "achieved",
]);

export const createQuestSchema = z.object({
  name: z.string().trim().min(1, "Give the quest a name.").max(120),
  color: questColorSchema.optional(),
  targetHoursWeek: z.number().int().min(1).max(168).nullable().optional(),
});

export const updateQuestSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Give the quest a name.").max(120).optional(),
  color: questColorSchema.optional(),
  health: questHealthSchema.nullable().optional(),
  targetHoursWeek: z.number().int().min(1).max(168).nullable().optional(),
});

export const setQuestLifecycleSchema = z.object({
  id: z.uuid(),
  lifecycle: questLifecycleSchema,
});

export const questIdSchema = z.object({ id: z.uuid() });

export type CreateQuestInput = z.infer<typeof createQuestSchema>;
export type UpdateQuestInput = z.infer<typeof updateQuestSchema>;
export type SetQuestLifecycleInput = z.infer<typeof setQuestLifecycleSchema>;
