import { QuestDot } from "@/components/quest-dot";
import type { QuestOption } from "@/features/quests/components/quest-picker";
import { formatHours } from "@/lib/duration";
import { TaskRow } from "./task-row";
import type { TaskRow as TaskRowData } from "../queries";

/**
 * PRODUCT_PLAN §3, "current lean": a list-first Today, but grouped under
 * quest-coloured headers. That borrows Option C's opinionated feel — the day
 * reads as "which quests am I advancing" — without fighting a future calendar
 * column, which is why grouping lives here and not in the data layer.
 */

type Group = {
  key: string;
  questId: string | null;
  name: string;
  color: string | null;
  tasks: TaskRowData[];
  trackedMinutes: number;
};

const ADMIN_KEY = "admin";

function groupByQuest(
  tasks: readonly TaskRowData[],
  quests: readonly QuestOption[],
): Group[] {
  const groups = new Map<string, Group>();

  for (const quest of quests) {
    groups.set(quest.id, {
      key: quest.id,
      questId: quest.id,
      name: quest.name,
      color: quest.color,
      tasks: [],
      trackedMinutes: 0,
    });
  }

  groups.set(ADMIN_KEY, {
    key: ADMIN_KEY,
    questId: null,
    name: "Admin",
    color: null,
    tasks: [],
    trackedMinutes: 0,
  });

  for (const task of tasks) {
    const group = groups.get(task.questId ?? ADMIN_KEY) ?? groups.get(ADMIN_KEY)!;
    group.tasks.push(task);
    group.trackedMinutes += task.trackedMinutes;
  }

  // Admin stays last so the leftover bucket reads as the minority it should be.
  return [...groups.values()]
    .filter((group) => group.tasks.length > 0)
    .sort((a, b) => Number(a.questId === null) - Number(b.questId === null));
}

export function TaskList({
  tasks,
  quests,
  dateKey,
  nextDateKey,
  grouped = true,
}: {
  tasks: readonly TaskRowData[];
  quests: readonly QuestOption[];
  dateKey?: string;
  nextDateKey?: string;
  grouped?: boolean;
}) {
  // Stamped once per server render so running timers tick from a known point.
  const asOf = new Date().toISOString();

  if (!grouped) {
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
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      {groupByQuest(tasks, quests).map((group) => (
        <section key={group.key}>
          <header className="mb-1 flex items-center justify-between gap-3 px-2">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <QuestDot color={group.color} />
              {group.name}
            </h2>
            <span className="text-muted-foreground text-xs tabular-nums">
              {formatHours(group.trackedMinutes)}
            </span>
          </header>

          <ul className="divide-border/60 divide-y">
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                quests={quests}
                dateKey={dateKey}
                nextDateKey={nextDateKey}
                asOf={asOf}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
