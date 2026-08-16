import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listActiveQuests } from "@/features/quests/queries";
import { AddTaskForm } from "@/features/tasks/components/add-task-form";
import { TaskList } from "@/features/tasks/components/task-list";
import { listBacklogTasks } from "@/features/tasks/queries";
import { requireUser } from "@/lib/session";
import { shiftDateKey, todayKey } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";

export const metadata: Metadata = { title: "Backlog · Quest" };

/**
 * The backlog / quick-capture surface, given its own page (PRODUCT_PLAN §3,
 * Option B's "backlog doubles as the inbox"). It used to live only as a card in
 * the Today rail; pulling it out keeps Today about *today* while giving
 * unscheduled work a real home you can manage and file onto a day one click at
 * a time.
 *
 * A task with no `plannedDate` is a backlog task — the same nullable column that
 * makes "plan for today" a single write.
 */
export default async function BacklogPage() {
  const user = await requireUser();
  const timeZone = await getTimeZone();

  const today = todayKey(timeZone);
  const tomorrow = shiftDateKey(today, 1, timeZone);

  const [tasks, quests] = await Promise.all([
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
      <PageHeader
        title="Backlog"
        description="Everything captured but not yet on a day. File it onto today when you're ready to work it."
      />

      <Card className="gap-0 py-4">
        <CardContent className="space-y-2 px-2">
          <div className="px-2">
            <AddTaskForm
              quests={questOptions}
              plannedDate={null}
              placeholder="Capture something for later…"
            />
          </div>

          {tasks.length === 0 ? (
            <div className="px-2 pt-2">
              <EmptyState
                title="Nothing waiting"
                description="A clear backlog is a good sign — capture stray ideas here so they're off your mind but not lost."
              />
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              quests={questOptions}
              dateKey={today}
              nextDateKey={tomorrow}
              showPlanAction
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
