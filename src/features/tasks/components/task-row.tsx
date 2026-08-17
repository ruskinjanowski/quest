"use client";

import { FileText, GripVertical } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  QuestPicker,
  type QuestOption,
} from "@/features/quests/components/quest-picker";
import { useAction } from "@/hooks/use-action";
import { formatClock } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { toggleTask, updateTask } from "../actions";
import { costOf } from "../domain";
import type { TaskRow as TaskRowData } from "../queries";
import { ScheduleMenu, type ScheduleOption } from "./schedule-menu";
import { TaskDetailDialog } from "./task-detail-dialog";

/** Everything a row needs to be dragged, owned by whichever list orders it. */
export type RowDrag = {
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  dragging: boolean;
  dropTarget: boolean;
};

/**
 * One task as a line rather than a card — the backlog and a quest's own task
 * list, where the day board's projected times mean nothing.
 *
 * The quest picker stays on the row: assigning work to a quest is the app's
 * core interaction (PRODUCT_PLAN 0.2) and must never sit behind a click.
 * Everything else opens the same detail panel the board's cards open.
 */
export function TaskRow({
  task,
  quests,
  scheduleOptions,
  showSchedule = true,
  drag,
}: {
  task: TaskRowData;
  quests: readonly QuestOption[];
  scheduleOptions: readonly ScheduleOption[];
  /** Hide the day picker where the list is already about one day. */
  showSchedule?: boolean;
  drag?: RowDrag;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useAction(toggleTask);
  const update = useAction(updateTask);

  return (
    <>
      <li
        draggable={drag !== undefined}
        onDragStart={drag?.onDragStart}
        onDragEnd={drag?.onDragEnd}
        onDragOver={drag?.onDragOver}
        onDrop={drag?.onDrop}
        className={cn(
          "group hover:bg-muted/40 relative flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-2 py-2 transition-colors",
          task.done && "opacity-60",
          drag?.dragging && "opacity-40",
          drag?.dropTarget &&
            "before:bg-quest before:absolute before:inset-x-2 before:-top-px before:h-0.5 before:rounded-full",
        )}
      >
        {drag && (
          <GripVertical
            aria-hidden
            className="text-muted-foreground/40 group-hover:text-muted-foreground -ml-1 size-4 shrink-0 cursor-grab transition-colors"
          />
        )}

        <Checkbox
          checked={task.done}
          disabled={toggle.pending}
          aria-label={task.done ? "Mark as not done" : "Mark as done"}
          onCheckedChange={(checked) =>
            toggle.run({
              id: task.id,
              done: checked === true,
              actualMinutes:
                checked === true ? (task.actualMinutes ?? task.estimateMinutes) : undefined,
            })
          }
        />

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-w-0 flex-1 text-left"
        >
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm",
              task.done && "line-through",
            )}
          >
            <span className="truncate" title={task.title}>
              {task.title}
            </span>
            {task.notes && (
              <FileText
                aria-label="Has notes"
                className="text-muted-foreground/70 size-3.5 shrink-0"
              />
            )}
          </span>
        </button>

        <div className="flex w-full items-center justify-end gap-1.5 pl-7 sm:w-auto sm:pl-0">
          {(task.estimateMinutes !== null || task.done) && (
            <span
              className="text-muted-foreground text-xs tabular-nums"
              title={task.done ? "Actual" : "Planned"}
            >
              {formatClock(task.done ? costOf(task) : (task.estimateMinutes ?? 0))}
            </span>
          )}

          <QuestPicker
            value={task.questId}
            quests={quests}
            disabled={update.pending}
            onChange={(questId) => update.run({ id: task.id, questId })}
            className="border-transparent"
          />

          {showSchedule && (
            <ScheduleMenu
              value={task.plannedDate}
              options={scheduleOptions}
              disabled={update.pending}
              onSelect={(plannedDate) => update.run({ id: task.id, plannedDate })}
            />
          )}
        </div>
      </li>

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
