import type { TaskHorizon } from "@/db/schema";

/**
 * The backlog's buckets, in the order Sunsama shows them: nearest first,
 * "Never" last. A task's horizon is how honest you are being about when — or
 * whether — it happens, which is a different question from which quest it
 * serves.
 *
 * `horizon` is nullable in the database (a scheduled task has no horizon), so
 * everything reading it goes through `horizonOf`, which lands stray nulls in
 * the nearest bucket rather than inventing a seventh one.
 */

export const TASK_HORIZONS = [
  { value: "week", label: "This week or two", initial: "W" },
  { value: "month", label: "This month", initial: "M" },
  { value: "quarter", label: "This quarter", initial: "Q" },
  { value: "year", label: "This year", initial: "Y" },
  { value: "someday", label: "Someday", initial: "S" },
  { value: "never", label: "Never", initial: "N" },
] as const satisfies readonly { value: TaskHorizon; label: string; initial: string }[];

export const DEFAULT_HORIZON: TaskHorizon = "week";

const LABELS = new Map(TASK_HORIZONS.map((horizon) => [horizon.value, horizon.label]));

export function horizonOf(horizon: TaskHorizon | null): TaskHorizon {
  return horizon ?? DEFAULT_HORIZON;
}

export function horizonLabel(horizon: TaskHorizon | null): string {
  return LABELS.get(horizonOf(horizon)) ?? LABELS.get(DEFAULT_HORIZON)!;
}

export function isTaskHorizon(value: string): value is TaskHorizon {
  return LABELS.has(value as TaskHorizon);
}
