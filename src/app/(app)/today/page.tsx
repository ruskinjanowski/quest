import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DayNav } from "@/features/planning/components/day-nav";
import { DayPlan } from "@/features/planning/components/day-plan";
import { DaySummary } from "@/features/planning/components/day-summary";
import { DayTimeline } from "@/features/planning/components/day-timeline";
import { PlanMyDayDialog } from "@/features/planning/components/plan-my-day-dialog";
import { listDayBlocks } from "@/features/planning/queries";
import { listActiveQuests } from "@/features/quests/queries";
import { AddTaskForm } from "@/features/tasks/components/add-task-form";
import { TaskList } from "@/features/tasks/components/task-list";
import {
  listBacklogTasks,
  listTasksForDay,
  listUnfinishedBefore,
} from "@/features/tasks/queries";
import { TimerBar } from "@/features/time-tracking/components/timer-bar";
import { getRunningTimer } from "@/features/time-tracking/queries";
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
 * Timer-first and single-column. The one action the product is about — track
 * time against a quest — sits at the very top as a Clockify-style bar; below it
 * the day takes shape (what it cost, then the list itself, grouped by quest).
 * Leftovers from earlier days sit quietly at the foot rather than in a standing
 * side rail, and the backlog/inbox now has its own page — Today is for today.
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

  const [tasks, backlog, unfinished, quests, blocks, running] = await Promise.all([
    listTasksForDay(user.id, dateKey),
    listBacklogTasks(user.id),
    listUnfinishedBefore(user.id, dateKey),
    listActiveQuests(user.id),
    listDayBlocks(user.id, dateKey, timeZone),
    getRunningTimer(user.id),
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
    <div className="mx-auto max-w-4xl">
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

      {/* `min-w-0` so the timeline's scroll container scrolls inside itself
          rather than stretching the page sideways on a phone. */}
      <div className="min-w-0 space-y-5">
        <TimerBar
          quests={questOptions}
          dateKey={dateKey}
          asOf={asOf}
          running={
            running
              ? {
                  taskTitle: running.taskTitle,
                  questName: running.questName,
                  questColor: running.questColor,
                  startedAt: running.startedAt.toISOString(),
                }
              : null
          }
        />

        {(tasks.length > 0 || trackedMinutes > 0) && (
          <DaySummary tasks={tasks} asOf={asOf}>
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
                : "Start a timer above, or add a task and link it to the quest it advances."
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

        {unfinished.length > 0 && (
          <section className="border-t pt-5">
            <h2 className="px-2 text-sm font-medium">Left over from earlier</h2>
            <p className="text-muted-foreground mb-1 px-2 text-xs">
              Unfinished from earlier days. Pull it onto today or let it go — but
              decide.
            </p>
            <TaskList
              tasks={unfinished}
              quests={questOptions}
              dateKey={dateKey}
              nextDateKey={nextKey}
              showPlanAction
            />
          </section>
        )}
      </div>
    </div>
  );
}
