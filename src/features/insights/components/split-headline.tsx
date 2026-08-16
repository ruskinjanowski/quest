import { formatHours, formatPercent } from "@/lib/duration";
import type { SplitSummary, TimeContext } from "../domain";
import { HOURS_IN_WEEK } from "../domain";

/**
 * The product, in one number (PRODUCT_PLAN 0.5). The Loom opens here.
 *
 * Two denominators are shown deliberately (open question 6): the tracked share
 * leads because it is the fair comparison, and the share of the whole week sits
 * underneath because it is the confronting one.
 */
export function SplitHeadline({
  summary,
  context,
  rangeLabel,
}: {
  summary: SplitSummary;
  context: TimeContext;
  rangeLabel: string;
}) {
  const questPercent = summary.questShare * 100;

  return (
    <section className="space-y-5 rounded-xl border p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Quest hours · {rangeLabel}</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">
            {formatHours(summary.questMinutes)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-muted-foreground text-sm">Admin hours</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums opacity-70">
            {formatHours(summary.adminMinutes)}
          </p>
        </div>
      </div>

      <div>
        <div
          className="bg-muted flex h-3 w-full overflow-hidden rounded-full"
          role="img"
          aria-label={`${formatPercent(summary.questShare)} of tracked time on quests`}
        >
          <div className="bg-quest h-full" style={{ width: `${questPercent}%` }} />
          <div
            className="bg-admin h-full"
            style={{ width: `${100 - questPercent}%` }}
          />
        </div>

        <div className="text-muted-foreground mt-2 flex justify-between text-xs">
          <span>{formatPercent(summary.questShare)} quests</span>
          <span>{formatPercent(summary.adminShare)} admin</span>
        </div>
      </div>

      <p className="text-muted-foreground text-sm text-balance">
        {formatPercent(context.shareOfTracked)} of the time you tracked went to your
        quests — that&apos;s {formatPercent(context.shareOfWeek, 1)} of a{" "}
        {HOURS_IN_WEEK}-hour week.
      </p>
    </section>
  );
}
