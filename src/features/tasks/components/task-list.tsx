import type { QuestOption } from "@/features/quests/components/quest-picker";
import { TaskRow } from "./task-row";
import type { TaskRow as TaskRowData } from "../queries";

/**
 * A flat list of tasks — a quest's own tasks, or the side rail's backlog and
 * leftovers. The Today page's grouped, reorderable version lives in
 * `planning/components/day-plan.tsx`, because ordering a day needs client state
 * and this doesn't.
 */
export function TaskList({
  tasks,
  quests,
  dateKey,
  nextDateKey,
  showPlanAction = false,
  dense = false,
}: {
  tasks: readonly TaskRowData[];
  quests: readonly QuestOption[];
  dateKey?: string;
  nextDateKey?: string;
  /** Offer one-click "put this on the open day" on every row. */
  showPlanAction?: boolean;
  /** Drop the estimate and timer — for the narrow side rail. */
  dense?: boolean;
}) {
  // Stamped once per server render so running timers tick from a known point.
  const asOf = new Date().toISOString();

  // A single-quest list is already on that quest's page, so repeating the quest
  // on every row is noise; a mixed list is the one place the name earns space.
  const questIsImplied = quests.length <= 1;

  return (
    <ul className="divide-border/60 divide-y">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          quests={quests}
          dateKey={dateKey}
          nextDateKey={nextDateKey}
          asOf={asOf}
          questIsImplied={questIsImplied}
          showPlanAction={showPlanAction}
          dense={dense}
        />
      ))}
    </ul>
  );
}
