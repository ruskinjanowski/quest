import type { TaskHorizon } from "@/db/schema";
import type { QuestColorKey } from "@/lib/quest-colors";

/**
 * The demo dataset, as data rather than SQL.
 *
 * PRODUCT_PLAN §5 wants ~4 weeks of history for 3–4 quests plus admin, written
 * *before* the payoff screen gets polished so the charts render something real.
 * It is generated from a seeded PRNG so every reseed produces the same story —
 * the Loom can be re-shot without the numbers moving.
 *
 * Since there is no timer, history is just tasks: each carries a `PLANNED`
 * estimate and, once done, an `ACTUAL` that misses it a little in either
 * direction. That gap is the thing the day headers and quest pages report.
 */

export type DemoQuest = {
  name: string;
  description: string;
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
    description: "So I can hold a real conversation on the trip in March.",
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
    description: "Get it in front of real users instead of rebuilding the data layer again.",
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
    description: "Three sessions a week. The number that matters is showing up.",
    color: "orange",
    targetHoursWeek: 6,
    health: "at_risk",
    lifecycle: "active",
    weight: 0.7,
    taskTitles: ["Gym — push day", "Gym — pull day", "Long run", "Mobility session"],
  },
  {
    name: "Read 12 books",
    description: "Finished in July — twelve down, and the habit stuck.",
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

/**
 * The unplanned pool, spread across the horizon buckets so the backlog reads as
 * a triage surface on camera rather than one flat list — "Never" included,
 * because that bucket is the honest half of the idea.
 */
export const DEMO_BACKLOG_TASKS: {
  title: string;
  questIndex: number | null;
  estimateMinutes: number | null;
  horizon: TaskHorizon;
}[] = [
  { title: "Sketch the pricing page", questIndex: 1, estimateMinutes: 90, horizon: "week" },
  { title: "Write the launch email", questIndex: 1, estimateMinutes: 30, horizon: "week" },
  { title: "Book a physio appointment", questIndex: 2, estimateMinutes: 15, horizon: "week" },
  { title: "Renew domain", questIndex: null, estimateMinutes: 15, horizon: "month" },
  { title: "Plan next month's Spanish goals", questIndex: 0, estimateMinutes: 30, horizon: "month" },
  { title: "Find a conversation tutor", questIndex: 0, estimateMinutes: 45, horizon: "quarter" },
  { title: "Run a half marathon", questIndex: 2, estimateMinutes: 120, horizon: "year" },
  { title: "Learn to sail", questIndex: null, estimateMinutes: null, horizon: "someday" },
  { title: "Rewrite the whole thing in Rust", questIndex: 1, estimateMinutes: null, horizon: "never" },
];

/** Tasks waiting on today and the next two days — the board needs a shape. */
export const DEMO_UPCOMING_TASKS: {
  /** Days from today. 0 = today. */
  daysAhead: number;
  questIndex: number | null;
  title: string;
  estimateMinutes: number;
}[] = [
  { daysAhead: 0, questIndex: 1, title: "Build the onboarding flow", estimateMinutes: 120 },
  { daysAhead: 0, questIndex: 0, title: "Conversation exchange", estimateMinutes: 45 },
  { daysAhead: 0, questIndex: null, title: "Inbox triage", estimateMinutes: 30 },
  { daysAhead: 0, questIndex: 2, title: "Gym — push day", estimateMinutes: 60 },
  { daysAhead: 1, questIndex: 1, title: "Fix the billing bug", estimateMinutes: 90 },
  { daysAhead: 1, questIndex: null, title: "Weekly team sync", estimateMinutes: 60 },
  { daysAhead: 1, questIndex: 0, title: "Vocabulary review", estimateMinutes: 30 },
  { daysAhead: 2, questIndex: 1, title: "Write the launch post", estimateMinutes: 90 },
  { daysAhead: 2, questIndex: 2, title: "Long run", estimateMinutes: 75 },
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

export type DemoTask = {
  /** Days before today. 1 = yesterday; today is staged separately. */
  daysAgo: number;
  questIndex: number | null;
  title: string;
  estimateMinutes: number;
  actualMinutes: number;
};

/** Share of finished time going to quests in the oldest week, and per-week gain. */
const QUEST_SHARE_START = 0.36;
const QUEST_SHARE_STEP = 0.1;

/**
 * Builds ~4 weeks of finished tasks.
 *
 * The generator works from an explicit daily budget rather than flipping a coin
 * per task: each day gets a number of minutes, split quest/admin by the week's
 * target share, and the quest half is divided between quests in proportion to
 * their weight.
 *
 * An earlier coin-flip version produced a trend line that read as noise —
 * per-task variance swamped the drift. The arc *is* the point of that chart
 * (PRODUCT_PLAN 1.5), so it is modelled directly rather than hoped for.
 */
export function buildDemoHistory(days = 28, seed = 20260823): DemoTask[] {
  const random = createRandom(seed);
  const tasks: DemoTask[] = [];

  for (let daysAgo = days; daysAgo >= 1; daysAgo--) {
    const dayIndex = days - daysAgo; // 0 = oldest day
    const weekIndex = Math.floor(dayIndex / 7);
    const isWeekend = dayIndex % 7 >= 5;

    // Roughly 16–18h of finished work a week, thinner at weekends.
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
      const actual = roundTo5((questMinutes * quest.weight) / chosenWeight);
      if (actual < 15) continue;

      tasks.push({
        daysAgo,
        questIndex,
        title: quest.taskTitles[Math.floor(random() * quest.taskTitles.length)],
        estimateMinutes: estimateFor(actual, random),
        actualMinutes: actual,
      });
    }

    // Admin arrives in one or two chunks, never as a single heroic block.
    const adminChunks = adminMinutes > 75 ? 2 : 1;
    for (let chunk = 0; chunk < adminChunks; chunk++) {
      const actual = roundTo5(adminMinutes / adminChunks);
      if (actual < 10) continue;

      tasks.push({
        daysAgo,
        questIndex: null,
        title: DEMO_ADMIN_TASKS[Math.floor(random() * DEMO_ADMIN_TASKS.length)],
        estimateMinutes: estimateFor(actual, random),
        actualMinutes: actual,
      });
    }
  }

  return tasks;
}

/**
 * A plausible estimate for a task that actually took `actual`: rounded to the
 * quarter hour and, more often than not, optimistic — which is what makes the
 * planned-versus-actual gap on the day header worth looking at.
 */
function estimateFor(actual: number, random: () => number): number {
  const bias = 0.8 + random() * 0.35;
  return Math.max(15, Math.round((actual * bias) / 15) * 15);
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
