import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { listActiveQuests } from "@/features/quests/queries";
import { AddTaskForm } from "@/features/tasks/components/add-task-form";
import { TaskList } from "@/features/tasks/components/task-list";
import { listBacklogTasks, listTasksForDay } from "@/features/tasks/queries";
import { requireUser } from "@/lib/session";
import { formatDayLabel, todayKey } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";

export const metadata: Metadata = { title: "Today · Quest" };

export default async function TodayPage() {
  const user = await requireUser();
  const timeZone = await getTimeZone();
  const dateKey = todayKey(timeZone);

  const [tasks, backlog, quests] = await Promise.all([
    listTasksForDay(user.id, dateKey),
    listBacklogTasks(user.id),
    listActiveQuests(user.id),
  ]);

  const questOptions = quests.map((quest) => ({
    id: quest.id,
    name: quest.name,
    color: quest.color,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Today" description={formatDayLabel(dateKey, timeZone)} />

      <div className="space-y-6">
        <AddTaskForm quests={questOptions} plannedDate={dateKey} />

        {tasks.length === 0 ? (
          <EmptyState
            title="Nothing planned yet"
            description={
              quests.length === 0
                ? "Start with a quest — the thing you actually want to move forward — then give it a task."
                : "Add a task above and link it to the quest it advances."
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
          <TaskList tasks={tasks} quests={questOptions} dateKey={dateKey} />
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
                grouped={false}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
