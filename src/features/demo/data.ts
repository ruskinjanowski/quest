import type { QuestColorKey } from "@/lib/quest-colors";

/**
 * The demo dataset, as data rather than SQL.
 *
 * PRODUCT_PLAN §5 wants ~4 weeks of history for 3–4 quests plus admin, written
 * *before* Insights gets polished so the charts render something real. It is
 * generated from a seeded PRNG so every reseed produces the same story — the
 * Loom can be re-shot without the numbers moving.
 */

export type DemoQuest = {
  name: string;
  color: QuestColorKey;
  targetHoursWeek: number | null;
  health: "on_track" | "at_risk" | "off_track" | "achieved" | null;
  lifecycle: "active" | "completed";
  /** Rough share of that quest's work in a typical week, before noise. */
  weight: number;
  taskTitles: string[];
};

export const DEMO_QUESTS: DemoQuest[] = [
  {
    name: "Learn Spanish",
    color: "teal",
    targetHoursWeek: 3,
    health: "on_track",
    lifecycle: "active",
    weight: 1,
    taskTitles: [
      "Duolingo session",
      "Watch an episode with subtitles",
      "Vocabulary review",
      "Conversation exchange",
    ],
  },
  {
    name: "Ship side project",
    color: "violet",
    targetHoursWeek: 6,
    health: "on_track",
    lifecycle: "active",
    weight: 1.6,
    taskTitles: [
      "Build the onboarding flow",
      "Fix the billing bug",
      "Write the launch post",
      "Refactor the data layer",
    ],
  },
  {
    name: "Get strong",
    color: "orange",
    targetHoursWeek: 6,
    health: "at_risk",
    lifecycle: "active",
    weight: 0.7,
    taskTitles: ["Gym — push day", "Gym — pull day", "Long run", "Mobility session"],
  },
  {
    name: "Read 12 books",
    color: "amber",
    targetHoursWeek: null,
    health: "achieved",
    lifecycle: "completed",
    weight: 0.3,
    taskTitles: ["Evening reading", "Finish current book"],
  },
];

export const DEMO_ADMIN_TASKS = [
  "Inbox triage",
  "Weekly team sync",
  "Expense report",
  "Recruiter calls",
  "Invoicing",
  "Slack catch-up",
];

export const DEMO_BACKLOG_TASKS: { title: string; questIndex: number | null }[] = [
  { title: "Plan next month's Spanish goals", questIndex: 0 },
  { title: "Sketch the pricing page", questIndex: 1 },
  { title: "Renew domain", questIndex: null },
];

/** Deterministic PRNG — same seed, same demo story, every reseed. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DemoEntry = {
  /** Days before today. 0 = today. */
  daysAgo: number;
  questIndex: number | null;
  taskTitle: string;
  minutes: number;
  /** Hour of the day the entry starts, in the user's zone. */
  startHour: number;
};

/** Share of tracked time going to quests in the oldest week, and per-week gain. */
const QUEST_SHARE_START = 0.36;
const QUEST_SHARE_STEP = 0.1;

/**
 * Builds ~4 weeks of tracked time.
 *
 * The generator works from an explicit daily budget rather than flipping a coin
 * per session: each day gets a number of minutes, split quest/admin by the
 * week's target share, and the quest half is divided between quests in
 * proportion to their weight.
 *
 * The earlier coin-flip version produced a trend line that read as noise —
 * per-session variance swamped the drift. The arc *is* the point of that chart
 * (PRODUCT_PLAN 1.5), so it is modelled directly rather than hoped for.
 */
export function buildDemoEntries(days = 28, seed = 20260823): DemoEntry[] {
  const random = createRandom(seed);
  const entries: DemoEntry[] = [];

  for (let daysAgo = days - 1; daysAgo >= 0; daysAgo--) {
    const dayIndex = days - 1 - daysAgo; // 0 = oldest day
    const weekIndex = Math.floor(dayIndex / 7);
    const isWeekend = dayIndex % 7 >= 5;

    // Roughly 16–18h tracked a week, thinner at weekends.
    const budget = isWeekend
      ? 70 + Math.round(random() * 50)
      : 175 + Math.round(random() * 70);

    // Jitter stops the chart looking like a ruler, but stays well inside the
    // week-over-week step so the upward arc survives it.
    const questShare = clamp(
      QUEST_SHARE_START + weekIndex * QUEST_SHARE_STEP + (random() - 0.5) * 0.1,
      0.1,
      0.9,
    );

    const questMinutes = roundTo5(budget * questShare);
    const adminMinutes = roundTo5(budget - questMinutes);
    let startHour = isWeekend ? 10 : 9;

    // One or two quests a day — nobody advances four things before lunch.
    const chosen = pickWeightedDistinct(
      random,
      DEMO_QUESTS.map((quest) =>
        // The completed quest only shows activity in the first fortnight —
        // that is what "Achieved" should look like in the history.
        quest.lifecycle === "completed" && weekIndex > 1 ? 0 : quest.weight,
      ),
      isWeekend ? 1 : 2,
    );

    const chosenWeight = chosen.reduce(
      (sum, index) => sum + DEMO_QUESTS[index].weight,
      0,
    );

    for (const questIndex of chosen) {
      const quest = DEMO_QUESTS[questIndex];
      const minutes = roundTo5((questMinutes * quest.weight) / chosenWeight);
      if (minutes < 15) continue;

      entries.push({
        daysAgo,
        questIndex,
        taskTitle: quest.taskTitles[Math.floor(random() * quest.taskTitles.length)],
        minutes,
        startHour,
      });
      startHour += 2;
    }

    // Admin arrives in one or two chunks, never as a single heroic block.
    const adminChunks = adminMinutes > 75 ? 2 : 1;
    for (let chunk = 0; chunk < adminChunks; chunk++) {
      const minutes = roundTo5(adminMinutes / adminChunks);
      if (minutes < 10) continue;

      entries.push({
        daysAgo,
        questIndex: null,
        taskTitle: DEMO_ADMIN_TASKS[Math.floor(random() * DEMO_ADMIN_TASKS.length)],
        minutes,
        startHour,
      });
      startHour += 2;
    }
  }

  return entries;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo5(minutes: number): number {
  return Math.round(minutes / 5) * 5;
}

/** Weighted sample without replacement. A zero weight is never picked. */
function pickWeightedDistinct(
  random: () => number,
  weights: number[],
  count: number,
): number[] {
  const pool = weights
    .map((weight, index) => ({ index, weight }))
    .filter((item) => item.weight > 0);
  const picked: number[] = [];

  for (let round = 0; round < count && pool.length > 0; round++) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let threshold = random() * total;
    let chosenAt = pool.length - 1;

    for (let i = 0; i < pool.length; i++) {
      threshold -= pool[i].weight;
      if (threshold <= 0) {
        chosenAt = i;
        break;
      }
    }

    picked.push(pool[chosenAt].index);
    pool.splice(chosenAt, 1);
  }

  return picked;
}
