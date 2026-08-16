"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { QuestDot } from "@/components/quest-dot";
import type { QuestOption } from "@/features/quests/components/quest-picker";
import { AddTaskForm } from "@/features/tasks/components/add-task-form";
import { TaskRow } from "@/features/tasks/components/task-row";
import { reorderTasks, updateTask } from "@/features/tasks/actions";
import type { TaskRow as TaskRowData } from "@/features/tasks/queries";
import { useRunningElapsedMinutes } from "@/features/time-tracking/use-running-elapsed";
import { formatHours, formatStopwatch } from "@/lib/duration";
import { cn } from "@/lib/utils";

/**
 * The day, grouped under quest-coloured headers (PRODUCT_PLAN §3 "current
 * lean": a list-first Today borrowing Option C's opinionated feel, without
 * fighting a future calendar column).
 *
 * A client component because a plan you can't rearrange isn't a plan. Dragging
 * a row reorders it; dragging it onto another quest's header reassigns it —
 * which is the app's core interaction made physical. `sortOrder` finally has
 * something writing to it: `reorderTasks` existed since the first commit and
 * nothing had ever called it.
 *
 * Drag-and-drop is mouse-only by nature, so every move is also reachable from
 * the row's menu (Move up / Move down) and its quest picker.
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

/**
 * A move, applied locally while the server catches up. `useOptimistic` reverts
 * it automatically when the transition settles, so there is no stale local copy
 * of the list to reconcile — the server row order is always the truth a beat
 * later.
 */
type Move = { ids: string[]; assign?: { id: string; questId: string | null } };

function applyMove(tasks: readonly TaskRowData[], move: Move): TaskRowData[] {
  const rank = new Map(move.ids.map((id, index) => [id, index]));

  return tasks
    .map((task) =>
      move.assign && task.id === move.assign.id
        ? { ...task, questId: move.assign.questId }
        : task,
    )
    .sort(
      (a, b) =>
        (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
}

export function DayPlan({
  tasks,
  quests,
  dateKey,
  nextDateKey,
  asOf,
}: {
  tasks: readonly TaskRowData[];
  quests: readonly QuestOption[];
  dateKey: string;
  nextDateKey: string;
  /** Server render time (ISO) — running timers tick from it. */
  asOf: string;
}) {
  const [view, applyOptimistic] = useOptimistic(tasks, applyMove);
  const [, startTransition] = useTransition();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropRowId, setDropRowId] = useState<string | null>(null);
  const [dropGroupKey, setDropGroupKey] = useState<string | null>(null);

  const groups = groupByQuest(view, quests);
  const flat = groups.flatMap((group) => group.tasks);

  // One ticker for the page: only the group holding the running task moves, and
  // it moves in step with that task's own timer.
  const elapsed = useRunningElapsedMinutes(
    asOf,
    view.some((task) => task.isRunning),
  );

  function commit(move: Move) {
    startTransition(async () => {
      applyOptimistic(move);

      if (move.assign) {
        const assigned = await updateTask({
          id: move.assign.id,
          questId: move.assign.questId,
        });
        if (!assigned.ok) {
          toast.error(assigned.error);
          return;
        }
      }

      const reordered = await reorderTasks(move.ids);
      if (!reordered.ok) toast.error(reordered.error);
    });
  }

  /**
   * Puts `id` next to `targetId`. `questId` is only passed when the gesture was
   * about the quest — dragging across a group boundary. Move up/down stay
   * inside their own group, because a keyboard-reachable "move down" that
   * silently refiled a task under a different quest would be a trap.
   */
  function place(
    id: string,
    targetId: string,
    after: boolean,
    questId?: string | null,
  ) {
    const without = flat.filter((task) => task.id !== id);
    const at = without.findIndex((task) => task.id === targetId);
    if (at === -1) return;

    const index = after ? at + 1 : at;
    const ids = [
      ...without.slice(0, index).map((task) => task.id),
      id,
      ...without.slice(index).map((task) => task.id),
    ];

    const task = flat.find((candidate) => candidate.id === id);
    const changesQuest =
      task !== undefined && questId !== undefined && task.questId !== questId;

    commit({ ids, assign: changesQuest ? { id, questId } : undefined });
  }

  function clearDrag() {
    setDraggingId(null);
    setDropRowId(null);
    setDropGroupKey(null);
  }

  function dropOnRow(targetId: string) {
    const id = draggingId;
    clearDrag();
    if (id === null || id === targetId) return;

    const target = flat.find((task) => task.id === targetId);
    place(id, targetId, false, target?.questId);
  }

  /** Dropping on a header means "this belongs to that quest now", at its end. */
  function dropOnGroup(group: Group) {
    const id = draggingId;
    clearDrag();
    if (id === null) return;

    const last = group.tasks.filter((task) => task.id !== id).at(-1);

    if (last === undefined) {
      // Already the group's only task — nothing to reorder, nothing to assign.
      return;
    }

    place(id, last.id, true, group.questId);
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const live = group.tasks.some((task) => task.isRunning);

        return (
          <section
            key={group.key}
            onDragOver={(event) => {
              event.preventDefault();
              setDropGroupKey(group.key);
            }}
            onDragLeave={() => setDropGroupKey((current) => (current === group.key ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              dropOnGroup(group);
            }}
            className={cn(
              "rounded-lg transition-colors",
              dropGroupKey === group.key && draggingId !== null && "bg-muted/50",
            )}
          >
            <header className="mb-1 flex items-center justify-between gap-3 px-2">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <QuestDot color={group.color} />
                {group.name}
              </h2>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  live ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {live
                  ? formatStopwatch(group.trackedMinutes + elapsed)
                  : formatHours(group.trackedMinutes)}
              </span>
            </header>

            <ul className="divide-border/60 divide-y">
              {group.tasks.map((task, index) => {
                const previous = group.tasks[index - 1];
                const next = group.tasks[index + 1];

                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    quests={quests}
                    dateKey={dateKey}
                    nextDateKey={nextDateKey}
                    asOf={asOf}
                    questIsImplied
                    onMoveUp={
                      previous ? () => place(task.id, previous.id, false) : undefined
                    }
                    onMoveDown={next ? () => place(task.id, next.id, true) : undefined}
                    drag={{
                      dragging: draggingId === task.id,
                      dropTarget: dropRowId === task.id && draggingId !== task.id,
                      onDragStart: (event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", task.id);
                        setDraggingId(task.id);
                      },
                      onDragEnd: clearDrag,
                      onDragOver: (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setDropRowId(task.id);
                        setDropGroupKey(null);
                      },
                      onDrop: (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        dropOnRow(task.id);
                      },
                    }}
                  />
                );
              })}
            </ul>

            <AddTaskForm
              quests={quests}
              plannedDate={dateKey}
              defaultQuestId={group.questId}
              placeholder={`Add to ${group.name}…`}
              variant="inline"
            />
          </section>
        );
      })}
    </div>
  );
}
