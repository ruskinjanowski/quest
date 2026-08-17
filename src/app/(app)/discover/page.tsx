import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SHARED_QUEST_BUCKETS } from "@/features/discover/data";
import { BucketCard } from "@/features/discover/components/bucket-card";
import { PrivacyNote } from "@/features/discover/components/privacy-note";
import {
  formatCount,
  matchQuests,
  otherBuckets,
  totalMembers,
} from "@/features/discover/domain";
import { listActiveQuests } from "@/features/quests/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Shared quests · Quest" };

/**
 * ⚠️ STUB — PRODUCT_PLAN 2.1, extended. Every person and count comes from
 * `features/discover/data.ts`; the only real read on this page is the user's
 * own quests, used to decide which buckets to show first.
 *
 * Its own page rather than a shelf on Home, because Home has one job (the
 * split) and browsing people is a different mode entirely. You arrive here
 * deliberately — from the line under Active quests, or from a quest's own page.
 */
export default async function DiscoverPage() {
  const user = await requireUser();
  const quests = await listActiveQuests(user.id);

  const matches = matchQuests(quests);
  const others = otherBuckets(matches);
  const reach = totalMembers(SHARED_QUEST_BUCKETS);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Shared quests"
        description={`${formatCount(reach)} people are working on the same handful of things. Not a feed and not a leaderboard — a way to see what someone else's week actually looks like.`}
      />

      <PrivacyNote />

      {matches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Quests you share</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <BucketCard
                key={match.bucket.slug}
                bucket={match.bucket}
                matchedQuestName={match.questName}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium">
          {matches.length > 0 ? "Other quests people are on" : "Quests people are on"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((bucket) => (
            <BucketCard key={bucket.slug} bucket={bucket} />
          ))}
        </div>
      </section>

      <p className="text-muted-foreground text-xs text-balance">
        Buckets group intent, not wording — “Learn Spanish” and “Japanese, N4 by
        December” land in the same place. In a real build that’s embedding
        similarity over quest names; here it’s a fixed list.
      </p>
    </div>
  );
}
