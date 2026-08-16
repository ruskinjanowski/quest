import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DayNav } from "@/features/planning/components/day-nav";
import { DayPlan } from "@/features/planning/components/day-plan";
import { DayRail } from "@/features/planning/components/day-rail";
import { DaySummary } from "@/features/planning/components/day-summary";
import { DayTimeline } from "@/features/planning/components/day-timeline";
import { PlanMyDayDialog } from "@/features/planning/components/plan-my-day-dialog";
import { listDayBlocks } from "@/features/planning/queries";
import { listActiveQuests } from "@/features/quests/queries";
import { AddTaskForm } from "@/features/tasks/components/add-task-form";
import {
  listBacklogTasks,
  listTasksForDay,
  listUnfinishedBefore,
} from "@/features/tasks/queries";
import { requireUser } from "@/lib/session";
import {
  dayHeading,
  formatDayLabel,
  isDateKey,
  shiftDateKey,
  todayKey,
} from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";

export const metadata: Metadata = { title: "Today · Quest" };

/**
 * The home screen, and where the day gets decided (PRODUCT_PLAN §3, Option A
 * with C's quest grouping).
 *
 * Two columns. The left one is the day in the order it happens: what it costs,
 * what shape it has, then the list itself. The right one is everything that
 * could join it — yesterday's leftovers and the inbox — each row one click from
 * the day. That pairing is what a planner is; keeping the backlog at the bottom
 * of a single column, reachable only through a hover menu, was the reason
 * getting work onto the day never felt obvious.
 *
 * The viewed day comes from `?date=` so the page stays a server component and
 * any day is linkable — the morning ritual often happens the evening before.
 */
export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const params = await searchParams;
  const requested = Array.isArray(params.date) ? params.date[0] : params.date;

  const user = await requireUser();
  const timeZone = await getTimeZone();

  const today = todayKey(timeZone);
  const dateKey = isDateKey(requested) ? requested : today;
  const previousKey = shiftDateKey(dateKey, -1, timeZone);
  const nextKey = shiftDateKey(dateKey, 1, timeZone);

  const [tasks, backlog, unfinished, quests, blocks] = await Promise.all([
    listTasksForDay(user.id, dateKey),
    listBacklogTasks(user.id),
    listUnfinishedBefore(user.id, dateKey),
    listActiveQuests(user.id),
    listDayBlocks(user.id, dateKey, timeZone),
  ]);

  const questOptions = quests.map((quest) => ({
    id: quest.id,
    name: quest.name,
    color: quest.color,
  }));

  const heading = dayHeading(dateKey, today, timeZone);
  const trackedMinutes = tasks.reduce((sum, task) => sum + task.trackedMinutes, 0);

  // Running timers tick from a single server timestamp rather than each row
  // inventing its own — see the React Compiler note in CLAUDE.md.
  const asOf = new Date().toISOString();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={heading}
        description={formatDayLabel(dateKey, timeZone)}
        actions={
          <>
            <DayNav
              previousKey={previousKey}
              nextKey={nextKey}
              isToday={dateKey === today}
            />
            <PlanMyDayDialog
              dateKey={dateKey}
              dayLabel={heading}
              quests={questOptions}
              todayTasks={tasks}
              unfinishedTasks={unfinished}
              backlogTasks={backlog}
              // Opening on an empty day is the "Tag starten" beat from
              // Focus.so: the ritual meets you, you don't go looking for it.
              autoOpen={
                dateKey === today &&
                tasks.length === 0 &&
                unfinished.length + backlog.length > 0
              }
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* `min-w-0`: a grid item sizes to its widest child by default, so the
            timeline's scroll container would otherwise stretch the whole page
            sideways on a phone instead of scrolling inside itself. */}
        <div className="min-w-0 space-y-5">
          {(tasks.length > 0 || trackedMinutes > 0) && (
            <DaySummary tasks={tasks}>
              <DayTimeline blocks={blocks} />
            </DaySummary>
          )}

          <AddTaskForm quests={questOptions} plannedDate={dateKey} />

          {tasks.length === 0 ? (
            <EmptyState
              title="Nothing planned yet"
              description={
                quests.length === 0
                  ? "Start with a quest — the thing you actually want to move forward — then give it a task."
                  : "Plan the day from your inbox on the right, or add a task above and link it to the quest it advances."
              }
              action={
                quests.length === 0 ? (
                  <Button asChild size="sm">
                    <Link href="/quests">Create your first quest</Link>
                  </Button>
                ) : null
              }
            />
          ) : (
            <DayPlan
              tasks={tasks}
              quests={questOptions}
              dateKey={dateKey}
              nextDateKey={nextKey}
              asOf={asOf}
            />
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-20">
          <DayRail
            unfinished={unfinished}
            backlog={backlog}
            quests={questOptions}
            dateKey={dateKey}
            nextDateKey={nextKey}
          />
        </aside>
      </div>
    </div>
  );
}
