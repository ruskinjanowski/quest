"use client";

import { Plus } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { QuestDot } from "@/components/quest-dot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  QuestPicker,
  type QuestOption,
} from "@/features/quests/components/quest-picker";
import { createTask, moveTask } from "@/features/tasks/actions";
import { EstimatePicker } from "@/features/tasks/components/estimate-picker";
import type { ScheduleOption } from "@/features/tasks/components/schedule-menu";
import { TaskRow } from "@/features/tasks/components/task-row";
import { DEFAULT_HORIZON, TASK_HORIZONS, horizonOf } from "@/features/tasks/horizons";
import type { TaskRow as TaskRowData } from "@/features/tasks/queries";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";
import type { TaskHorizon } from "@/db/schema";

/**
 * The backlog, in Sunsama's time-horizon buckets.
 *
 * The useful question about unscheduled work isn't which list it's on, it's
 * *when — or whether —* it happens, so the buckets run from "this week or two"
 * out to "Never". "Never" is not a joke bucket: a planner that can't admit
 * you're not going to do something just accumulates guilt.
 *
 * Grouping by quest is one click away, because the same rows answer a second
 * question — which quest is starved of work.
 */

type Grouping = "horizon" | "quest";

type Move = { id: string; horizon: TaskHorizon; orderedIds: string[] };

function applyMove(tasks: readonly TaskRowData[], move: Move): TaskRowData[] {
  const rank = new Map(move.orderedIds.map((id, index) => [id, index]));

  return tasks
    .map((task) => (task.id === move.id ? { ...task, horizon: move.horizon } : task))
    .sort(
      (a, b) =>
        (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
}

export function BacklogBoard({
  tasks,
  quests,
  scheduleOptions,
}: {
  tasks: readonly TaskRowData[];
  quests: readonly QuestOption[];
  scheduleOptions: readonly ScheduleOption[];
}) {
  const [grouping, setGrouping] = useState<Grouping>("horizon");
  const [view, applyOptimistic] = useOptimistic(tasks, applyMove);
  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropBucket, setDropBucket] = useState<string | null>(null);

  function dropOn(horizon: TaskHorizon) {
    const id = draggingId;
    setDraggingId(null);
    setDropBucket(null);
    if (id === null) return;

    const task = view.find((candidate) => candidate.id === id);
    if (!task || horizonOf(task.horizon) === horizon) return;

    const orderedIds = [
      ...view
        .filter(
          (candidate) => horizonOf(candidate.horizon) === horizon && candidate.id !== id,
        )
        .map((candidate) => candidate.id),
      id,
    ];

    startTransition(async () => {
      applyOptimistic({ id, horizon, orderedIds });
      const result = await moveTask({ id, plannedDate: null, horizon, orderedIds });
      if (!result.ok) toast.error(result.error);
    });
  }

  const groups =
    grouping === "horizon"
      ? TASK_HORIZONS.map((horizon) => ({
          key: horizon.value,
          label: horizon.label,
          initial: horizon.initial,
          color: null as string | null,
          horizon: horizon.value,
          tasks: view.filter((task) => horizonOf(task.horizon) === horizon.value),
        }))
      : groupByQuest(view, quests);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <span className="text-muted-foreground text-xs">Group by</span>
        <div className="bg-muted flex rounded-lg p-0.5">
          {(["horizon", "quest"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setGrouping(option)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs capitalize transition-colors",
                grouping === option
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        {groups.map((group) => {
          // Pulled out of the object so it narrows inside the drop handler —
          // and because only the horizon view has anywhere to drop *into*.
          const horizon: TaskHorizon | null = group.horizon;

          return (
          <section
            key={group.key}
            onDragOver={
              horizon
                ? (event) => {
                    event.preventDefault();
                    setDropBucket(group.key);
                  }
                : undefined
            }
            onDragLeave={() =>
              setDropBucket((current) => (current === group.key ? null : current))
            }
            onDrop={
              horizon
                ? (event) => {
                    event.preventDefault();
                    dropOn(horizon);
                  }
                : undefined
            }
            className={cn(
              "border-b last:border-b-0",
              dropBucket === group.key && draggingId !== null && "bg-muted/60",
            )}
          >
            <header className="bg-muted/40 flex items-center gap-2.5 px-3 py-2">
              {group.initial ? (
                <span className="bg-background text-muted-foreground flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold">
                  {group.initial}
                </span>
              ) : (
                <QuestDot color={group.color} />
              )}
              <h2 className="flex-1 text-sm font-medium">{group.label}</h2>
              <span className="text-muted-foreground text-xs">
                {group.tasks.length === 0
                  ? "No tasks"
                  : `${group.tasks.length} task${group.tasks.length === 1 ? "" : "s"}`}
              </span>
            </header>

            {group.tasks.length > 0 && (
              <ul className="divide-border/60 divide-y px-1 py-1">
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    quests={quests}
                    scheduleOptions={scheduleOptions}
                    drag={{
                      dragging: draggingId === task.id,
                      dropTarget: false,
                      onDragStart: (event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", task.id);
                        setDraggingId(task.id);
                      },
                      onDragEnd: () => {
                        setDraggingId(null);
                        setDropBucket(null);
                      },
                      onDragOver: (event) => event.preventDefault(),
                      onDrop: (event) => event.preventDefault(),
                    }}
                  />
                ))}
              </ul>
            )}
          </section>
          );
        })}
      </div>
    </div>
  );
}

function groupByQuest(
  tasks: readonly TaskRowData[],
  quests: readonly QuestOption[],
): {
  key: string;
  label: string;
  initial: null;
  color: string | null;
  horizon: TaskHorizon | null;
  tasks: TaskRowData[];
}[] {
  const groups = quests.map((quest) => ({
    key: quest.id,
    label: quest.name,
    initial: null,
    color: quest.color as string | null,
    horizon: null,
    tasks: tasks.filter((task) => task.questId === quest.id),
  }));

  return [
    ...groups,
    {
      key: "admin",
      label: "Admin",
      initial: null,
      color: null,
      horizon: null,
      tasks: tasks.filter((task) => task.questId === null),
    },
  ].filter((group) => group.tasks.length > 0);
}

/**
 * Quick capture. Everything lands in the nearest bucket unless you say
 * otherwise — the point of an inbox is that filing it is a later problem.
 */
export function BacklogCapture({ quests }: { quests: readonly QuestOption[] }) {
  const [title, setTitle] = useState("");
  const [questId, setQuestId] = useState<string | null>(null);
  const [estimateMinutes, setEstimateMinutes] = useState<number | null>(null);

  const { run, pending } = useAction(createTask, {
    onSuccess: () => setTitle(""),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;
        run({
          title: trimmed,
          questId,
          plannedDate: null,
          estimateMinutes,
          horizon: DEFAULT_HORIZON,
        });
      }}
      className="focus-within:border-ring flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-2"
    >
      <Plus className="text-muted-foreground size-4 shrink-0" />
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Capture something for later…"
        aria-label="Task title"
        className="h-8 min-w-0 flex-1 basis-48 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <QuestPicker value={questId} quests={quests} onChange={setQuestId} />
      <EstimatePicker value={estimateMinutes} onChange={setEstimateMinutes} />
      <Button type="submit" size="sm" disabled={pending || !title.trim()}>
        Add
      </Button>
    </form>
  );
}
