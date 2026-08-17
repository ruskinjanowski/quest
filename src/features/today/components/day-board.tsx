"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import type { QuestOption } from "@/features/quests/components/quest-picker";
import { moveTask } from "@/features/tasks/actions";
import { TaskCard } from "@/features/tasks/components/task-card";
import type { ScheduleOption } from "@/features/tasks/components/schedule-menu";
import {
  DAY_CAPACITY_MINUTES,
  projectStarts,
  summariseDay,
} from "@/features/tasks/domain";
import type { TaskRow } from "@/features/tasks/queries";
import { SplitBar } from "@/features/insights/components/split-bar";
import { formatClock, formatPercent } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { AddTaskRow } from "./add-task-row";

/**
 * The planner: days as columns, tasks as cards you drag between them.
 *
 * A client component because a plan you can't rearrange isn't a plan. Dragging
 * within a column reorders it — and because start times are projected from that
 * order, moving a card visibly moves the rest of the day. Dragging across
 * columns reschedules. Both halves of a drop travel to the server in one
 * `moveTask` call, so a task never renders in the right column at the wrong
 * position while a second request is in flight.
 *
 * Drag is mouse-only by nature, so every move is also one click away in the
 * card's own schedule menu.
 */

export type BoardDay = {
  dateKey: string;
  weekday: string;
  dayLabel: string;
  isToday: boolean;
};

type Move = { id: string; plannedDate: string | null; orderedIds: string[] };

function applyMove(tasks: readonly TaskRow[], move: Move): TaskRow[] {
  const rank = new Map(move.orderedIds.map((id, index) => [id, index]));

  return tasks
    .map((task) =>
      task.id === move.id ? { ...task, plannedDate: move.plannedDate } : task,
    )
    .sort(
      (a, b) =>
        (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
}

export function DayBoard({
  tasks,
  days,
  quests,
  scheduleOptions,
}: {
  tasks: readonly TaskRow[];
  days: readonly BoardDay[];
  quests: readonly QuestOption[];
  scheduleOptions: readonly ScheduleOption[];
}) {
  const [view, applyOptimistic] = useOptimistic(tasks, applyMove);
  const [, startTransition] = useTransition();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropCardId, setDropCardId] = useState<string | null>(null);
  const [dropColumnKey, setDropColumnKey] = useState<string | null>(null);

  const columns = days.map((day) => ({
    ...day,
    tasks: view.filter((task) => task.plannedDate === day.dateKey),
  }));

  function clearDrag() {
    setDraggingId(null);
    setDropCardId(null);
    setDropColumnKey(null);
  }

  /**
   * Places the dragged task in `dateKey`, before `beforeId` or at the end.
   * The whole destination order is recomputed here so the server is told the
   * result rather than the gesture.
   */
  function drop(dateKey: string, beforeId?: string) {
    const id = draggingId;
    clearDrag();
    if (id === null || id === beforeId) return;

    const destination = view
      .filter((task) => task.plannedDate === dateKey && task.id !== id)
      .map((task) => task.id);

    const at = beforeId ? destination.indexOf(beforeId) : -1;
    const index = at === -1 ? destination.length : at;
    const orderedIds = [
      ...destination.slice(0, index),
      id,
      ...destination.slice(index),
    ];

    startTransition(async () => {
      applyOptimistic({ id, plannedDate: dateKey, orderedIds });
      const result = await moveTask({ id, plannedDate: dateKey, orderedIds });
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    // Columns scroll sideways on a narrow screen rather than squeezing to
    // nothing; `min-w-0` keeps that scroll inside the board.
    <div className="flex min-w-0 gap-4 overflow-x-auto pb-4">
      {columns.map((column, index) => {
        const summary = summariseDay(column.tasks);
        const starts = projectStarts(column.tasks);
        const progress =
          summary.plannedMinutes > 0
            ? Math.min(100, (summary.actualMinutes / summary.plannedMinutes) * 100)
            : 0;

        return (
          <section
            key={column.dateKey}
            onDragOver={(event) => {
              event.preventDefault();
              setDropColumnKey(column.dateKey);
            }}
            onDragLeave={() =>
              setDropColumnKey((current) =>
                current === column.dateKey ? null : current,
              )
            }
            onDrop={(event) => {
              event.preventDefault();
              drop(column.dateKey);
            }}
            className={cn(
              // Columns share the width they're given and only start scrolling
              // sideways once they'd be narrower than a task card reads well at.
              "flex min-w-64 flex-1 flex-col gap-3 rounded-xl p-1 transition-colors",
              dropColumnKey === column.dateKey &&
                draggingId !== null &&
                "bg-muted/60 ring-quest/30 ring-1",
            )}
          >
            <header className="space-y-2 px-1">
              <div>
                <h2
                  className={cn(
                    "text-2xl font-semibold tracking-tight",
                    !column.isToday && "text-muted-foreground",
                  )}
                >
                  {column.weekday}
                </h2>
                <p className="text-muted-foreground text-sm">{column.dayLabel}</p>
              </div>

              <div
                className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
                role="img"
                aria-label={`${summary.doneCount} of ${summary.taskCount} tasks done`}
              >
                <div
                  className="bg-quest h-full rounded-full transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* The Quest line, under the first column only: the split the
                  whole product is about, on the screen people live in. */}
              {index === 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                    <span className="text-foreground font-medium tabular-nums">
                      {formatClock(summary.questMinutes)} quest
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      · {formatClock(summary.adminMinutes)} admin
                    </span>
                    {summary.plannedMinutes > 0 && (
                      <span className="text-muted-foreground">
                        · {formatPercent(summary.questShare)} of the plan
                      </span>
                    )}
                  </p>
                  <SplitBar
                    questShare={summary.questShare}
                    adminShare={summary.adminShare}
                  />
                  {summary.actualMinutes > 0 && (
                    <p className="text-muted-foreground text-[11px] tabular-nums">
                      {formatClock(summary.questDoneMinutes)} of{" "}
                      {formatClock(summary.actualMinutes)} banked so far went to quests
                    </p>
                  )}
                </div>
              )}
            </header>

            <AddTaskRow
              quests={quests}
              plannedDate={column.dateKey}
              plannedMinutes={summary.plannedMinutes}
              over={summary.plannedMinutes > DAY_CAPACITY_MINUTES}
            />

            <div className="flex flex-col gap-2">
              {column.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  quests={quests}
                  startMinute={starts.get(task.id) ?? null}
                  scheduleOptions={scheduleOptions}
                  drag={{
                    dragging: draggingId === task.id,
                    dropTarget: dropCardId === task.id && draggingId !== task.id,
                    onDragStart: (event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", task.id);
                      setDraggingId(task.id);
                    },
                    onDragEnd: clearDrag,
                    onDragOver: (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDropCardId(task.id);
                      setDropColumnKey(column.dateKey);
                    },
                    onDrop: (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      drop(column.dateKey, task.id);
                    },
                  }}
                />
              ))}

              {column.tasks.length === 0 && (
                <p className="text-muted-foreground/70 px-3 py-6 text-center text-xs">
                  Nothing planned. Drag something here.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
