import Link from "next/link";
import { QuestDot } from "@/components/quest-dot";
import { AvatarStack } from "./person-avatar";
import { formatCount, unlistedCount } from "../domain";
import type { SharedQuestBucket } from "../data";

/**
 * A shared quest as a browsable bucket. Same anatomy as `QuestCard` on purpose —
 * dot, title, one big number, context underneath — so the shelf on Home and the
 * shelf here read as the same kind of object.
 *
 * The count of people is the headline because it's what makes you click, but
 * the hours sit right beside it: "187 people, typically 6h a week" is the claim
 * no other app can make, and it's the reason this belongs in *this* product.
 */
export function BucketCard({
  bucket,
  /** The user's own quest that landed them in this bucket, if any. */
  matchedQuestName,
}: {
  bucket: SharedQuestBucket;
  matchedQuestName?: string;
}) {
  return (
    <article className="hover:border-foreground/20 focus-within:border-foreground/20 relative rounded-xl border p-4 transition-colors">
      <h3 className="flex items-center gap-2 font-medium">
        <QuestDot color={bucket.color} />
        <Link
          href={`/discover/${bucket.slug}`}
          className="truncate after:absolute after:inset-0 after:content-['']"
        >
          {bucket.name}
        </Link>
      </h3>

      <p className="text-muted-foreground mt-1 truncate text-xs">
        {matchedQuestName
          ? `Your quest: ${matchedQuestName}`
          : bucket.alsoPursue[0]
            ? `Also on: ${bucket.alsoPursue[0].name}`
            : " "}
      </p>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          {formatCount(bucket.members)}
        </span>
        <span className="text-muted-foreground text-xs">
          typically {bucket.typicalHoursWeek}h/week
        </span>
      </div>

      <div className="mt-3">
        <AvatarStack
          names={bucket.people.slice(0, 4).map((person) => person.name)}
          extra={unlistedCount(bucket)}
        />
      </div>
    </article>
  );
}
