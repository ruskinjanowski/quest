import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SharedQuestsStrip } from "@/features/discover/components/shared-quests-strip";
import { AttentionCard } from "@/features/home/components/attention-card";
import { TodayCard } from "@/features/home/components/today-card";
import { getHomeOverview } from "@/features/home/queries";
import { QuestBreakdown } from "@/features/insights/components/quest-breakdown";
import { SplitHeadline } from "@/features/insights/components/split-headline";
import { TrendChart } from "@/features/insights/components/trend-chart";
import { QuestCard } from "@/features/quests/components/quest-card";
import { requireUser } from "@/lib/session";
import { formatDayLabel } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";

export const metadata: Metadata = { title: "Home · Quest" };

/**
 * The overview, and where Insights went (REDESIGN §4).
 *
 * The one number the product exists to show — quest hours against admin hours —
 * shouldn't be a page you remember to visit, so it meets you on arrival. Below
 * it: what today looks like, what the week is neglecting, and every active
 * quest as a way in.
 */
export default async function HomePage() {
  const user = await requireUser();
  const timeZone = await getTimeZone();
  const overview = await getHomeOverview(user.id, timeZone);

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hello, {firstName}
        </h1>
        <p className="text-muted-foreground text-sm">
          {formatDayLabel(overview.todayKey, timeZone)}
        </p>
      </header>

      {overview.quests.length === 0 ? (
        <EmptyState
          title="No quests yet"
          description="Quest measures one thing: how much of your time advances something you actually care about. Name the first one."
          action={
            <Button asChild size="sm">
              <Link href="/quests">Create your first quest</Link>
            </Button>
          }
        />
      ) : (
        <>
          <SplitHeadline
            summary={overview.week}
            context={overview.context}
            rangeLabel={overview.weekLabel}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <TodayCard summary={overview.today} byQuest={overview.todayByQuest} />
            <AttentionCard alerts={overview.alerts} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Last four weeks</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.hasAnyData ? (
                  <TrendChart points={overview.trend} />
                ) : (
                  <p className="text-muted-foreground py-10 text-center text-sm">
                    Finish a few tasks and the arc shows up here.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Where it went · {overview.weekLabel.toLowerCase()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overview.week.totalMinutes > 0 ? (
                  <QuestBreakdown summary={overview.week} />
                ) : (
                  <p className="text-muted-foreground py-10 text-center text-sm text-balance">
                    Nothing finished in the last week.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium">Active quests</h2>
              <Link
                href="/quests"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
              >
                Manage <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overview.quests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  rangeLabel="last 7 days"
                  nextTask={overview.nextTaskByQuest.get(quest.id)}
                />
              ))}
            </div>

            {/* Social's whole footprint on this page. It sits under the quest
                cards rather than beside the split on purpose — see the note in
                `shared-quests-strip.tsx`. */}
            <SharedQuestsStrip quests={overview.quests} />
          </section>
        </>
      )}
    </div>
  );
}
