import type { QuestOption } from "@/features/quests/components/quest-picker";
import type { TaskRow as TaskRowData } from "../queries";
import type { ScheduleOption } from "./schedule-menu";
import { TaskRow } from "./task-row";

/**
 * A flat list of tasks — a quest's own work, or a bucket of the backlog. The
 * day board's draggable, column-shaped version lives in `today/components`,
 * because ordering a day needs client state and this doesn't.
 */
export function TaskList({
  tasks,
  quests,
  scheduleOptions,
  showSchedule = true,
}: {
  tasks: readonly TaskRowData[];
  quests: readonly QuestOption[];
  scheduleOptions: readonly ScheduleOption[];
  showSchedule?: boolean;
}) {
  return (
    <ul className="divide-border/60 divide-y">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          quests={quests}
          scheduleOptions={scheduleOptions}
          showSchedule={showSchedule}
        />
      ))}
    </ul>
  );
}
