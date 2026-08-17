import {
  SHARED_QUEST_BUCKETS,
  type SharedQuestBucket,
  type SharedQuestMember,
} from "./data";

/**
 * Pure matching between a user's own quest names and the canonical buckets.
 *
 * ⚠️ STUB — PRODUCT_PLAN 2.1/2.3. Real canonicalisation is embedding
 * similarity over quest names (explicitly P3, "don't build"); a normalised
 * alias table gets the same *behaviour* on the demo data for none of the cost,
 * and keeps the swap local: replace these two functions, keep the components.
 */

/** Lowercase, strip punctuation, collapse whitespace — "Ship side project!" → "ship side project". */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The bucket a quest name belongs to, if any.
 *
 * Longest alias first, so "learn spanish" doesn't lose to a bare "spanish"
 * sitting in some other bucket — the more specific phrasing is the better
 * evidence.
 */
export function bucketForQuestName(name: string): SharedQuestBucket | null {
  const needle = normalise(name);
  if (!needle) return null;

  let best: { bucket: SharedQuestBucket; length: number } | null = null;

  for (const bucket of SHARED_QUEST_BUCKETS) {
    for (const alias of bucket.aliases) {
      if (!needle.includes(alias)) continue;
      if (best === null || alias.length > best.length) {
        best = { bucket, length: alias.length };
      }
    }
  }

  return best?.bucket ?? null;
}

export function bucketBySlug(slug: string): SharedQuestBucket | null {
  return SHARED_QUEST_BUCKETS.find((bucket) => bucket.slug === slug) ?? null;
}

export type QuestBucketMatch = {
  /** The user's own quest — the reason this bucket is on their screen. */
  questId: string;
  questName: string;
  bucket: SharedQuestBucket;
};

/**
 * Which of the user's quests other people are also on. One bucket at most per
 * quest, and a bucket appears once even if two quests land in it.
 */
export function matchQuests(
  quests: readonly { id: string; name: string }[],
): QuestBucketMatch[] {
  const seen = new Set<string>();
  const matches: QuestBucketMatch[] = [];

  for (const quest of quests) {
    const bucket = bucketForQuestName(quest.name);
    if (!bucket || seen.has(bucket.slug)) continue;

    seen.add(bucket.slug);
    matches.push({ questId: quest.id, questName: quest.name, bucket });
  }

  return matches;
}

export function totalMembers(buckets: readonly SharedQuestBucket[]): number {
  return buckets.reduce((sum, bucket) => sum + bucket.members, 0);
}

/** Everything the user isn't already on, for the browse page's second shelf. */
export function otherBuckets(
  matched: readonly QuestBucketMatch[],
): SharedQuestBucket[] {
  const taken = new Set(matched.map((match) => match.bucket.slug));
  return SHARED_QUEST_BUCKETS.filter((bucket) => !taken.has(bucket.slug));
}

/**
 * "1,481". Pinned to one locale rather than `toLocaleString()`, which resolves
 * against Node's locale on the server and the browser's on the client — the two
 * disagree on the thousands separator and React calls that a hydration error.
 */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * Initials for a placeholder avatar. Two letters is enough to tell rows apart
 * without implying a photo exists.
 */
export function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * The count a bucket doesn't show a face for. The browse list is a sample, and
 * saying so is better than implying `people.length` is the whole membership.
 */
export function unlistedCount(bucket: SharedQuestBucket): number {
  return Math.max(0, bucket.members - bucket.people.length);
}

/** Whether anyone in this bucket has published a link to follow. */
export function hasLinks(person: SharedQuestMember): boolean {
  return person.links.length > 0;
}
