import type { QuestHealth, QuestLifecycle } from "@/db/schema";

/**
 * Focus.so's vocabulary, kept verbatim (PRODUCT_PLAN 1.3b): the audience
 * already knows these labels, which is cheap familiarity for the open beta.
 */

export const QUEST_HEALTH_LABELS: Record<QuestHealth, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
  achieved: "Achieved",
};

export const QUEST_HEALTH_ORDER: QuestHealth[] = [
  "on_track",
  "at_risk",
  "off_track",
  "achieved",
];

/** Tailwind classes per health chip — kept out of the components so the chip looks the same everywhere. */
export const QUEST_HEALTH_CLASSES: Record<QuestHealth, string> = {
  on_track:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  at_risk: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  off_track: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  achieved: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

export const QUEST_LIFECYCLE_LABELS: Record<QuestLifecycle, string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};
