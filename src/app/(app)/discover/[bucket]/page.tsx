import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DemoBadge } from "@/components/demo-badge";
import { PageHeader } from "@/components/page-header";
import { QuestDot } from "@/components/quest-dot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonCard } from "@/features/discover/components/person-card";
import { PrivacyNote } from "@/features/discover/components/privacy-note";
import { SHARED_QUEST_BUCKETS } from "@/features/discover/data";
import {
  bucketBySlug,
  formatCount,
  unlistedCount,
} from "@/features/discover/domain";

export const metadata: Metadata = { title: "Shared quest · Quest" };

/**
 * ⚠️ STUB — PRODUCT_PLAN 2.1, extended. Everyone on this page is invented.
 *
 * The people in one bucket. Two things this deliberately does *not* do:
 *
 * - **Sort by hours.** The plan's words for this feature are "passive
 *   inspiration, not competition", and a list ordered by hours is a leaderboard
 *   whether or not it's labelled one. Order is recent activity; the bucket's
 *   typical hours sit in the header as context, so a 2h/week week reads as
 *   normal rather than last place.
 * - **Imply this is everyone.** `people` is a sample of `members`; the header
 *   says how many aren't shown, because a list of five under a count of 264
 *   otherwise reads as a bug.
 */
export default async function SharedQuestPage({
  params,
}: PageProps<"/discover/[bucket]">) {
  const { bucket: slug } = await params;
  const bucket = bucketBySlug(slug);
  if (!bucket) notFound();

  const unlisted = unlistedCount(bucket);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/discover"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-xs"
      >
        <ArrowLeft className="size-3" /> Shared quests
      </Link>

      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <QuestDot color={bucket.color} className="size-3" />
            {bucket.name}
          </span>
        }
        description={`${formatCount(bucket.members)} people · typically ${bucket.typicalHoursWeek}h a week`}
        actions={
          <DemoBadge hint="Social discovery is a phase-two idea. Every person and number here is hardcoded." />
        }
      />

      <PrivacyNote />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium">People on this quest</h2>
            <p className="text-muted-foreground text-xs">By recent activity</p>
          </div>

          <div className="space-y-2">
            {bucket.people.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                bucketColor={bucket.color}
              />
            ))}
          </div>

          {unlisted > 0 && (
            <p className="text-muted-foreground text-xs">
              {formatCount(unlisted)} more people are on this quest and
              haven’t made their profile public.
            </p>
          )}
        </section>

        <div className="space-y-6">
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                People here also pursue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {bucket.alsoPursue.map((related) => {
                  const target = SHARED_QUEST_BUCKETS.find(
                    (candidate) => candidate.name === related.name,
                  );

                  return (
                    <li
                      key={related.name}
                      className="flex items-center justify-between gap-3"
                    >
                      {target ? (
                        <Link
                          href={`/discover/${target.slug}`}
                          className="truncate hover:underline"
                        >
                          {related.name}
                        </Link>
                      ) : (
                        <span className="truncate">{related.name}</span>
                      )}
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {related.members}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Why hours and not scores
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm text-pretty">
              <p>
                Nobody is ranked here. The number under each name is that
                person’s rhythm, not their position.
              </p>
              <p>
                Typical for this quest is {bucket.typicalHoursWeek}h a week —
                which is the point: seeing that someone real is doing this in
                three hours is more useful than seeing who is doing the most.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
