import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/page-header";
import { QuestCard } from "@/features/quests/components/quest-card";
import { QuestDialog } from "@/features/quests/components/quest-dialog";
import { listQuestsWithStats } from "@/features/quests/queries";
import { requireUser } from "@/lib/session";
import { weekRange } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";

export const metadata: Metadata = { title: "Quests · Quest" };

/**
 * PRODUCT_PLAN 1.7 — the list splits into Active and Completed, so finishing a
 * quest reads as a payoff rather than a disappearance.
 */
export default async function QuestsPage() {
  const user = await requireUser();
  const timeZone = await getTimeZone();
  const range = weekRange(timeZone);

  const quests = await listQuestsWithStats(user.id, range);
  const active = quests.filter((quest) => quest.lifecycle === "active");
  const finished = quests.filter((quest) => quest.lifecycle !== "active");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Quests"
        description="The handful of things you actually want to move forward."
        actions={<QuestDialog />}
      />

      {quests.length === 0 ? (
        <EmptyState
          title="No quests yet"
          description="Create the first thing you want to advance — learning something, shipping something, building a habit."
          action={<QuestDialog />}
        />
      ) : (
        <div className="space-y-10">
          <section className="grid gap-3 sm:grid-cols-2">
            {active.map((quest) => (
              <QuestCard key={quest.id} quest={quest} rangeLabel="this week" />
            ))}
          </section>

          {finished.length > 0 && (
            <section>
              <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                Completed &amp; archived
              </h2>
              <div className="grid gap-3 opacity-75 sm:grid-cols-2">
                {finished.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} rangeLabel="this week" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
