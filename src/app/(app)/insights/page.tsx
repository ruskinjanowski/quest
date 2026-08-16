import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/page-header";
import { QuestBreakdown } from "@/features/insights/components/quest-breakdown";
import { SplitHeadline } from "@/features/insights/components/split-headline";
import { TimeframeTabs } from "@/features/insights/components/timeframe-tabs";
import { TrendChart } from "@/features/insights/components/trend-chart";
import { TREND_WEEKS, getInsights } from "@/features/insights/queries";
import { requireUser } from "@/lib/session";
import { isTimeframe } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";

export const metadata: Metadata = { title: "Insights · Quest" };

/**
 * The payoff screen and, framed differently, the weekly review
 * (PRODUCT_PLAN 0.5 / 2.5). Everything else in the app is scaffolding for it.
 */
export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const params = await searchParams;
  const requested = Array.isArray(params.timeframe)
    ? params.timeframe[0]
    : params.timeframe;
  const timeframe = isTimeframe(requested) ? requested : "week";

  const user = await requireUser();
  const timeZone = await getTimeZone();
  const insights = await getInsights(user.id, { timeframe, timeZone });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Weekly review"
        description="Did your time match your ambitions?"
        actions={<TimeframeTabs active={timeframe} />}
      />

      {!insights.hasAnyData ? (
        <EmptyState
          title="Nothing tracked yet"
          description="Start a timer on a task and this screen fills in. It's the one that matters."
        />
      ) : (
        <div className="space-y-10">
          <SplitHeadline
            summary={insights.summary}
            context={insights.context}
            rangeLabel={insights.rangeLabel}
          />

          <QuestBreakdown summary={insights.summary} />

          <section className="space-y-3">
            <h2 className="text-sm font-medium">Last {TREND_WEEKS} weeks</h2>
            <TrendChart points={insights.trend} />
          </section>
        </div>
      )}
    </div>
  );
}
