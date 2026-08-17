"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  QuestPicker,
  type QuestOption,
} from "@/features/quests/components/quest-picker";
import { useAction } from "@/hooks/use-action";
import { formatClock } from "@/lib/duration";
import { formatStartTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { toggleTask, updateTask } from "../actions";
import { costOf } from "../domain";
import type { TaskRow } from "../queries";
import { TaskDetailDialog } from "./task-detail-dialog";
import type { ScheduleOption } from "./schedule-menu";

/** What a card needs to be dragged, handed down by the board that owns ordering. */
export type CardDrag = {
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  dragging: boolean;
  /** Draw the insertion line above this card. */
  dropTarget: boolean;
};

/**
 * A task as it appears in a day column.
 *
 * The projected start time in the corner is computed from the column's order
 * and the estimates above it — nothing is stored — which is what makes dragging
 * a card up feel like moving an appointment rather than sorting a list.
 *
 * The whole card opens the detail panel; the two controls that matter most —
 * done, and which quest this serves — stay on the card itself, because putting
 * the product's core interaction behind a click would be the wrong trade.
 */
export function TaskCard({
  task,
  quests,
  startMinute,
  scheduleOptions,
  drag,
}: {
  task: TaskRow;
  quests: readonly QuestOption[];
  /** Minutes from midnight, from the column's projection. Null hides the time. */
  startMinute: number | null;
  scheduleOptions: readonly ScheduleOption[];
  drag?: CardDrag;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useAction(toggleTask);
  const update = useAction(updateTask);

  const cost = costOf(task);

  return (
    <>
      <article
        draggable={drag !== undefined}
        onDragStart={drag?.onDragStart}
        onDragEnd={drag?.onDragEnd}
        onDragOver={drag?.onDragOver}
        onDrop={drag?.onDrop}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") setOpen(true);
        }}
        role="button"
        tabIndex={0}
        aria-label={task.title}
        className={cn(
          "bg-card hover:border-foreground/15 focus-visible:ring-ring relative cursor-pointer rounded-lg border p-3 text-left shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none",
          task.done && "bg-muted/40 shadow-none",
          drag?.dragging && "opacity-40",
          drag?.dropTarget &&
            "before:bg-quest before:absolute before:inset-x-2 before:-top-1 before:h-0.5 before:rounded-full",
        )}
      >
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground text-xs tabular-nums">
            {startMinute === null ? "" : formatStartTime(startMinute)}
          </span>

          {(task.estimateMinutes !== null || task.done) && (
            <span
              className={cn(
                "bg-muted rounded px-1.5 py-0.5 text-xs tabular-nums",
                // A finished task shows what it *cost*; an unstarted one what
                // it was promised. Same slot, so the eye compares them across
                // the column without being told which is which.
                task.done ? "text-foreground font-medium" : "text-muted-foreground",
              )}
              title={task.done ? "Actual" : "Planned"}
            >
              {formatClock(task.done ? cost : (task.estimateMinutes ?? 0))}
            </span>
          )}
        </div>

        <p
          className={cn(
            "mb-2.5 text-sm leading-snug font-medium text-pretty",
            task.done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>

        {/* Clicks inside the controls must not also open the panel. */}
        <div
          className="flex items-center justify-between gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Checkbox
              checked={task.done}
              disabled={toggle.pending}
              aria-label={task.done ? "Mark as not done" : "Mark as done"}
              onCheckedChange={(checked) =>
                toggle.run({
                  id: task.id,
                  done: checked === true,
                  actualMinutes:
                    checked === true
                      ? (task.actualMinutes ?? task.estimateMinutes)
                      : undefined,
                })
              }
            />
            {task.notes && (
              <FileText
                aria-label="Has notes"
                className="text-muted-foreground/70 size-3.5"
              />
            )}
          </div>

          <QuestPicker
            value={task.questId}
            quests={quests}
            disabled={update.pending}
            onChange={(questId) => update.run({ id: task.id, questId })}
            className="h-6 max-w-[9rem] border-transparent px-1"
          />
        </div>
      </article>

      <TaskDetailDialog
        task={task}
        quests={quests}
        scheduleOptions={scheduleOptions}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
