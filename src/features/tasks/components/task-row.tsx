"use client";

import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  Clock,
  FileText,
  GripVertical,
  History,
  Inbox,
  MoreHorizontal,
  SkipForward,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EditTimeDialog } from "@/features/time-tracking/components/edit-time-dialog";
import { LogTimeDialog } from "@/features/time-tracking/components/log-time-dialog";
import { TimerButton } from "@/features/time-tracking/components/timer-button";
import { TaskNotesDialog } from "./task-notes-dialog";
import {
  QuestPicker,
  type QuestOption,
} from "@/features/quests/components/quest-picker";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";
import { deleteTask, toggleTask, updateTask } from "../actions";
import { EstimatePicker } from "./estimate-picker";
import type { TaskRow as TaskRowData } from "../queries";

/**
 * Everything a row can do, spread onto the `<li>` by whichever list owns the
 * ordering. Rows themselves stay ignorant of their neighbours.
 */
export type RowDrag = {
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  dragging: boolean;
  /** Draw the insertion line above this row. */
  dropTarget: boolean;
};

/**
 * One task, everywhere. Timer, quest assignment, estimate and completion all
 * sit on the row itself — the plan's "linking must be frictionless" requirement
 * means no detail screen stands between a task and its quest.
 *
 * These controls used to fade in on hover. That kept the row clean at the cost
 * of hiding every verb the product is actually about: at rest a row offered a
 * checkbox and a play button, and "assign this task to a quest" — the core
 * interaction of the whole app — was invisible until you happened to point at
 * it, and unreachable on touch. They are permanent now, and quiet instead.
 */
export function TaskRow({
  task,
  quests,
  dateKey,
  nextDateKey,
  asOf,
  questIsImplied = false,
  showPlanAction = false,
  dense = false,
  onMoveUp,
  onMoveDown,
  drag,
}: {
  task: TaskRowData;
  quests: readonly QuestOption[];
  /** Which day a manual log should land on. Defaults to today server-side. */
  dateKey?: string;
  /** The day after `dateKey` — what "push to tomorrow" means from here. */
  nextDateKey?: string;
  /** Server render time (ISO), so a running timer can tick without double-counting. */
  asOf: string;
  /**
   * True when the surrounding context already states the quest — a coloured
   * group header, or a quest's own detail page. The picker stays, compressed to
   * its dot: still one click to reassign, without repeating the header on every
   * row.
   */
  questIsImplied?: boolean;
  /** Offer a one-click "put this on the open day" button (the side rail). */
  showPlanAction?: boolean;
  /**
   * Narrow contexts (the side rail) drop the estimate and the timer: both are
   * about *today's* work, and neither fits beside a title in 20rem.
   */
  dense?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  drag?: RowDrag;
}) {
  const [logOpen, setLogOpen] = useState(false);
  const [editTimeOpen, setEditTimeOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const toggle = useAction(toggleTask);
  const update = useAction(updateTask);
  const remove = useAction(deleteTask);

  const canPlan = showPlanAction && dateKey !== undefined && task.plannedDate !== dateKey;

  return (
    <li
      draggable={drag !== undefined}
      onDragStart={drag?.onDragStart}
      onDragEnd={drag?.onDragEnd}
      onDragOver={drag?.onDragOver}
      onDrop={drag?.onDrop}
      className={cn(
        "group hover:bg-muted/40 relative flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-2 py-2 transition-colors",
        task.done && "opacity-55",
        drag?.dragging && "opacity-40",
        drag?.dropTarget && "before:bg-primary before:absolute before:inset-x-2 before:-top-px before:h-0.5 before:rounded-full",
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
        onCheckedChange={(checked) => toggle.run({ id: task.id, done: checked === true })}
      />

      <div className="min-w-0 flex-1">
        <p className={cn("flex items-center gap-1.5 text-sm", task.done && "line-through")}>
          <span className="truncate" title={task.title}>
            {task.title}
          </span>
          {task.notes && (
            <FileText
              aria-label="Has notes"
              className="text-muted-foreground/70 size-3.5 shrink-0"
            />
          )}
        </p>
      </div>

      {/* On a phone — and in the rail, at any width — the controls take their
          own line rather than squeezing the title down to two characters. */}
      <div
        className={cn(
          "flex w-full items-center justify-end gap-1.5 pl-7",
          !dense && "sm:w-auto sm:pl-0",
        )}
      >
        {canPlan && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-7"
                aria-label="Add to this day"
                disabled={update.pending}
                onClick={() => update.run({ id: task.id, plannedDate: dateKey })}
              >
                <CalendarPlus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add to this day</TooltipContent>
          </Tooltip>
        )}

        {!dense && (
          <EstimatePicker
            value={task.estimateMinutes}
            disabled={update.pending}
            onChange={(estimateMinutes) => update.run({ id: task.id, estimateMinutes })}
            className="border-transparent"
          />
        )}

        <QuestPicker
          value={task.questId}
          quests={quests}
          disabled={update.pending}
          onChange={(questId) => update.run({ id: task.id, questId })}
          compact={questIsImplied}
          className={cn(questIsImplied && "border-transparent")}
        />

        {!dense && (
          <TimerButton
            taskId={task.id}
            trackedMinutes={task.trackedMinutes}
            running={task.isRunning}
            asOf={asOf}
            disabled={task.done}
          />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground size-7"
              aria-label="Task actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            {(onMoveUp || onMoveDown) && (
              <>
                <DropdownMenuItem disabled={!onMoveUp} onSelect={() => onMoveUp?.()}>
                  <ArrowUp className="size-4" /> Move up
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!onMoveDown} onSelect={() => onMoveDown?.()}>
                  <ArrowDown className="size-4" /> Move down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem onSelect={() => setLogOpen(true)}>
              <Clock className="size-4" /> Log time manually
            </DropdownMenuItem>

            {task.trackedMinutes > 0 && (
              <DropdownMenuItem onSelect={() => setEditTimeOpen(true)}>
                <History className="size-4" /> Edit tracked time
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onSelect={() => setNotesOpen(true)}>
              <FileText className="size-4" /> {task.notes ? "Edit notes" : "Add notes"}
            </DropdownMenuItem>

            {task.plannedDate === null ? (
              <DropdownMenuItem
                onSelect={() => update.run({ id: task.id, plannedDate: dateKey ?? null })}
                disabled={!dateKey}
              >
                <CalendarPlus className="size-4" /> Plan for this day
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem
                  onSelect={() =>
                    update.run({ id: task.id, plannedDate: nextDateKey ?? null })
                  }
                  disabled={!nextDateKey}
                >
                  <SkipForward className="size-4" /> Push to tomorrow
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => update.run({ id: task.id, plannedDate: null })}
                >
                  <Inbox className="size-4" /> Move to backlog
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={remove.pending}
              onSelect={() => remove.run(task.id)}
            >
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LogTimeDialog
        taskId={task.id}
        taskTitle={task.title}
        dateKey={dateKey}
        open={logOpen}
        onOpenChange={setLogOpen}
      />

      <EditTimeDialog
        taskId={task.id}
        taskTitle={task.title}
        open={editTimeOpen}
        onOpenChange={setEditTimeOpen}
      />

      <TaskNotesDialog
        taskId={task.id}
        taskTitle={task.title}
        notes={task.notes}
        open={notesOpen}
        onOpenChange={setNotesOpen}
      />
    </li>
  );
}
