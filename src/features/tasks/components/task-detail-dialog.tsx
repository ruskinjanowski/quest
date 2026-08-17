"use client";

import { Copy, Inbox, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  QuestPicker,
  type QuestOption,
} from "@/features/quests/components/quest-picker";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";
import { createTask, deleteTask, toggleTask, updateTask } from "../actions";
import type { TaskRow } from "../queries";
import { DurationField } from "./duration-field";
import { ScheduleMenu, type ScheduleOption } from "./schedule-menu";

/**
 * One task, opened up.
 *
 * Deliberately four things: which quest it serves, which day it's on, what it
 * planned to cost against what it actually cost, and a notes box. Sunsama's own
 * panel also carries subtasks, a due date, a priority flag, comments and an
 * activity feed — none of which change the quest/admin split, which is the only
 * question this prototype exists to answer (REDESIGN §3b).
 *
 * The `PLANNED` / `ACTUAL` pair is lifted from Sunsama verbatim, minus the
 * stopwatch: that pair *is* a timer's output, so keeping the display and
 * dropping the clock loses the clock and nothing else. A Start button would
 * write into the same `ACTUAL` field later without moving any of this.
 */
export function TaskDetailDialog({
  task,
  quests,
  scheduleOptions,
  open,
  onOpenChange,
}: {
  task: TaskRow;
  quests: readonly QuestOption[];
  scheduleOptions: readonly ScheduleOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [notes, setNotes] = useState<string | null>(null);
  const update = useAction(updateTask);
  const toggle = useAction(toggleTask);
  const duplicate = useAction(createTask, { successMessage: "Task duplicated." });
  const remove = useAction(deleteTask, { successMessage: "Task deleted." });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-xl" showCloseButton>
        <DialogTitle className="sr-only">{task.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Quest, day, planned and actual time, and notes for this task.
        </DialogDescription>

        <header className="flex items-center gap-2 border-b px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
              Quest
            </p>
            <QuestPicker
              value={task.questId}
              quests={quests}
              disabled={update.pending}
              onChange={(questId) => update.run({ id: task.id, questId })}
              className="-ml-2 h-7 border-transparent px-2"
            />
          </div>

          <ScheduleMenu
            value={task.plannedDate}
            options={scheduleOptions}
            disabled={update.pending}
            onSelect={(plannedDate) => update.run({ id: task.id, plannedDate })}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground size-7"
                aria-label="More actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                disabled={duplicate.pending}
                onSelect={() =>
                  duplicate.run({
                    title: `${task.title} (copy)`,
                    notes: task.notes,
                    questId: task.questId,
                    plannedDate: task.plannedDate,
                    estimateMinutes: task.estimateMinutes,
                    horizon: task.horizon,
                  })
                }
              >
                <Copy className="size-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={task.plannedDate === null || update.pending}
                onSelect={() => update.run({ id: task.id, plannedDate: null })}
              >
                <Inbox className="size-4" /> Send to backlog
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={remove.pending}
                onSelect={() => {
                  onOpenChange(false);
                  remove.run(task.id);
                }}
              >
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="flex items-start gap-3 px-5 py-5">
          <Checkbox
            checked={task.done}
            disabled={toggle.pending}
            className="mt-1.5 size-5"
            aria-label={task.done ? "Mark as not done" : "Mark as done"}
            onCheckedChange={(checked) =>
              toggle.run({
                id: task.id,
                done: checked === true,
                // Ticking it off banks the estimate, so the honest path is one
                // click; the ACTUAL field beside it is the correction.
                actualMinutes:
                  checked === true ? (task.actualMinutes ?? task.estimateMinutes) : undefined,
              })
            }
          />

          <input
            defaultValue={task.title}
            aria-label="Task title"
            className={cn(
              "focus-visible:ring-ring min-w-0 flex-1 rounded-md bg-transparent px-1 py-1 text-xl font-semibold focus-visible:ring-2 focus-visible:outline-none",
              task.done && "text-muted-foreground line-through",
            )}
            onBlur={(event) => {
              const title = event.target.value.trim();
              if (title.length > 0 && title !== task.title) {
                update.run({ id: task.id, title });
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />

          <div className="flex shrink-0 items-start gap-3">
            <DurationField
              label="Actual"
              value={task.actualMinutes}
              emphasis
              disabled={update.pending}
              onChange={(actualMinutes) => update.run({ id: task.id, actualMinutes })}
            />
            <DurationField
              label="Planned"
              value={task.estimateMinutes}
              disabled={update.pending}
              onChange={(estimateMinutes) => update.run({ id: task.id, estimateMinutes })}
            />
          </div>
        </div>

        <div className="px-5 pb-5">
          <Textarea
            value={notes ?? task.notes ?? ""}
            placeholder="Notes…"
            rows={5}
            aria-label="Notes"
            className="resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
            onChange={(event) => setNotes(event.target.value)}
            onBlur={(event) => {
              setNotes(null);
              if (event.target.value !== (task.notes ?? "")) {
                update.run({ id: task.id, notes: event.target.value });
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
