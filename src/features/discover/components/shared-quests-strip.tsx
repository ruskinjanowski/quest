import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { DemoBadge } from "@/components/demo-badge";
import { SHARED_QUEST_BUCKETS } from "../data";
import { formatCount, matchQuests, totalMembers } from "../domain";

/**
 * ⚠️ STUB — PRODUCT_PLAN 2.1. The counts come from `data.ts`.
 *
 * Social's entire footprint on Home: one line. Home exists to make one number
 * unavoidable — quest hours against admin hours — and a shelf of faces under
 * the quest cards would compete with it directly. A single dashed row plants
 * the idea and costs the page nothing; the browsing happens on `/discover`.
 */
export function SharedQuestsStrip({
  quests,
}: {
  quests: readonly { id: string; name: string }[];
}) {
  const matches = matchQuests(quests);

  const [count, people] =
    matches.length > 0
      ? [matches.length, totalMembers(matches.map((match) => match.bucket))]
      : [0, totalMembers(SHARED_QUEST_BUCKETS)];

  return (
    <Link
      href="/discover"
      className="hover:border-foreground/20 hover:bg-muted/40 group flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors"
    >
      <Users className="text-muted-foreground size-4 shrink-0" />

      <p className="min-w-0 flex-1 text-sm text-pretty">
        {count > 0 ? (
          <>
            <span className="font-medium">
              {count} of your quests {count === 1 ? "is" : "are"} shared
            </span>{" "}
            <span className="text-muted-foreground">
              by {formatCount(people)} people
            </span>
          </>
        ) : (
          <>
            <span className="font-medium">
              {formatCount(people)} people
            </span>{" "}
            <span className="text-muted-foreground">
              are on shared quests
            </span>
          </>
        )}
      </p>

      <DemoBadge hint="Social discovery is a phase-two idea. These people and numbers are hardcoded." />

      <ArrowRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
    </Link>
  );
}
