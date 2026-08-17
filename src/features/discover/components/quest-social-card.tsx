import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { DemoBadge } from "@/components/demo-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarStack } from "./person-avatar";
import { SHARED_QUEST_BUCKETS } from "../data";
import { bucketForQuestName, formatCount, unlistedCount } from "../domain";

/**
 * ⚠️ STUB — PRODUCT_PLAN 2.1. Every number here is hardcoded.
 *
 * The quest page's window onto the same buckets `/discover` browses. It exists
 * to make the phase-two moat tangible in the Loom without building any of it:
 * passive inspiration, not competition. Replacing it means swapping `data.ts`
 * for a real query — nothing else in the app depends on it.
 *
 * A quest that matches no bucket says so rather than inventing a number. A
 * fabricated "142 people" under a quest nobody else has is the one thing that
 * would make the whole idea read as fake.
 */
export function QuestSocialCard({ questName }: { questName: string }) {
  const bucket = bucketForQuestName(questName);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4" /> Others on this quest
          <DemoBadge
            className="ml-auto"
            hint="Social discovery is a phase-two idea. These people and numbers are hardcoded."
          />
        </CardTitle>
      </CardHeader>

      {bucket === null ? (
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground text-pretty">
            Nobody has shared a quest like this one yet. It stays private either
            way.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1 text-xs underline underline-offset-2"
          >
            See what people are working on <ArrowRight className="size-3" />
          </Link>
        </CardContent>
      ) : (
        <CardContent className="space-y-4 text-sm">
          <div>
            <p>
              <span className="text-xl font-semibold tabular-nums">
                {formatCount(bucket.members)}
              </span>{" "}
              <span className="text-muted-foreground">
                people share “{bucket.name}”
              </span>
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Typically {bucket.typicalHoursWeek}h a week
            </p>
          </div>

          <Link
            href={`/discover/${bucket.slug}`}
            className="hover:border-foreground/20 hover:bg-muted/40 flex items-center gap-3 rounded-lg border p-2.5 transition-colors"
          >
            <AvatarStack
              names={bucket.people.slice(0, 3).map((person) => person.name)}
              extra={unlistedCount(bucket)}
            />
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs">
              Browse <ArrowRight className="size-3" />
            </span>
          </Link>

          <div>
            <p className="text-muted-foreground mb-2 text-xs">
              People on this quest also pursue
            </p>
            <ul className="space-y-1.5">
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
          </div>

          <p className="text-muted-foreground border-t pt-3 text-xs">
            Private by default. Sharing a quest is an explicit act, per quest and
            per platform.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
