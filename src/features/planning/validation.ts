import { z } from "zod";
import { dateKeyField, questIdField } from "../tasks/validation";

/**
 * "Plan my day" commits the whole list in one call rather than one request per
 * checkbox: the ritual is a single decision ("this is my day"), and a
 * half-applied plan would be worse than none.
 *
 * `plannedDate` is deliberately three-valued. A date plans the task, `null`
 * returns it to the backlog, and *omitting* it leaves the task where it is —
 * which is what an unfinished task from last Tuesday deserves when you decline
 * to pull it forward. Rewriting its date would quietly falsify that day.
 */
export const planDaySchema = z.object({
  dateKey: dateKeyField,
  tasks: z
    .array(
      z.object({
        id: z.uuid(),
        plannedDate: dateKeyField.nullable().optional(),
        questId: questIdField,
        estimateMinutes: z
          .number()
          .int()
          .min(1)
          .max(24 * 60)
          .nullable(),
      }),
    )
    .max(200),
});

export type PlanDayInput = z.infer<typeof planDaySchema>;
