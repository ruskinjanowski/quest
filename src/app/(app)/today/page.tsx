import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DayNav } from "@/features/planning/components/day-nav";
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
 * with C's quest grouping). The list is the centre; the summary above it states
 * what the day costs, and the timeline on the right gives it a shape.
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
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="space-y-6">
          {tasks.length > 0 && (
            <DaySummary tasks={tasks} trackedMinutes={trackedMinutes} />
          )}

          <AddTaskForm quests={questOptions} plannedDate={dateKey} />

          {tasks.length === 0 ? (
            <EmptyState
              title="Nothing planned yet"
              description={
                quests.length === 0
                  ? "Start with a quest — the thing you actually want to move forward — then give it a task."
                  : "Plan the day from your backlog, or add a task above and link it to the quest it advances."
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
            <TaskList
              tasks={tasks}
              quests={questOptions}
              dateKey={dateKey}
              nextDateKey={nextKey}
            />
          )}

          {backlog.length > 0 && (
            <>
              <Separator />
              <section>
                <h2 className="text-muted-foreground mb-1 px-2 text-xs font-medium tracking-wide uppercase">
                  Backlog
                </h2>
                <TaskList
                  tasks={backlog}
                  quests={questOptions}
                  dateKey={dateKey}
                  nextDateKey={nextKey}
                  grouped={false}
                />
              </section>
            </>
          )}
        </div>

        <Card className="hidden gap-3 py-4 lg:block">
          <CardHeader className="px-4">
            <CardTitle className="text-sm font-medium">The day</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <DayTimeline blocks={blocks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
