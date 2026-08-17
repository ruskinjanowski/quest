import { formatHours, formatPercent } from "@/lib/duration";
import type { SplitSummary, TimeContext } from "../domain";
import { ADMIN_LABEL, HOURS_IN_WEEK } from "../domain";

/**
 * The product, in one number (PRODUCT_PLAN 0.5). The Loom opens here.
 *
 * Two denominators are shown deliberately (open question 6): the tracked share
 * leads in prose because it is the fair comparison, while the *bar* is the whole
 * 168-hour week because that is the confronting one. Quests grow from the left,
 * admin from the right, and the hours you never logged sit between them — so the
 * two bars you care about stay adjacent to their own labels instead of being
 * pushed apart by a remainder nobody planned.
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
  // Clamped, not scaled: a week of estimates *can* exceed 168 hours, and the bar
  // should bottom out at "no slack left" rather than silently rescale the week.
  const questPercent = Math.min(100, context.shareOfWeek * 100);
  const adminPercent = Math.min(100 - questPercent, context.adminShareOfWeek * 100);

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
          <p className="text-muted-foreground text-sm">{ADMIN_LABEL} hours</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums opacity-70">
            {formatHours(summary.adminMinutes)}
          </p>
        </div>
      </div>

      <div>
        <div
          className="bg-muted flex h-3 w-full overflow-hidden rounded-full"
          role="img"
          aria-label={`Of a ${HOURS_IN_WEEK}-hour week, ${formatHours(summary.questMinutes)} on quests and ${formatHours(summary.adminMinutes)} on ${ADMIN_LABEL.toLowerCase()}; ${formatHours(context.untrackedMinutes)} untracked`}
        >
          <div
            className="bg-quest h-full"
            // A sliver still has to be visible: 20 minutes of a 168-hour week is
            // 0.2% of the bar, which rounds to nothing on a narrow screen.
            style={{ width: `${questPercent}%`, minWidth: questPercent > 0 ? 3 : 0 }}
          />
          <div className="h-full flex-1" />
          <div
            className="bg-admin h-full"
            style={{ width: `${adminPercent}%`, minWidth: adminPercent > 0 ? 3 : 0 }}
          />
        </div>

        <div className="text-muted-foreground mt-2 grid grid-cols-3 text-xs">
          <span>{formatPercent(context.shareOfWeek, 1)} quests</span>
          <span className="text-center">
            {formatHours(context.untrackedMinutes, 0)} untracked
          </span>
          <span className="text-right">
            {formatPercent(context.adminShareOfWeek, 1)} {ADMIN_LABEL.toLowerCase()}
          </span>
        </div>
      </div>

      <p className="text-muted-foreground text-sm text-balance">
        {formatPercent(context.shareOfTracked)} of the work you finished went to your
        quests — {formatHours(summary.questMinutes)} out of a {HOURS_IN_WEEK}-hour week.
      </p>
    </section>
  );
}
