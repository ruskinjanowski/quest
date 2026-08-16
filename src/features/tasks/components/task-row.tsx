"use client";

import { CalendarPlus, Clock, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogTimeDialog } from "@/features/time-tracking/components/log-time-dialog";
import { TimerButton } from "@/features/time-tracking/components/timer-button";
import {
  QuestPicker,
  type QuestOption,
} from "@/features/quests/components/quest-picker";
import { useAction } from "@/hooks/use-action";
import { formatDuration } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { deleteTask, toggleTask, updateTask } from "../actions";
import type { TaskRow as TaskRowData } from "../queries";

/**
 * One task, everywhere. Timer, quest assignment and completion all sit on the
 * row itself — the plan's "linking must be frictionless" requirement means no
 * detail screen stands between a task and its quest.
 */
export function TaskRow({
  task,
  quests,
  dateKey,
  asOf,
  showQuestPicker = true,
}: {
  task: TaskRowData;
  quests: readonly QuestOption[];
  /** Which day a manual log should land on. Defaults to today server-side. */
  dateKey?: string;
  /** Server render time (ISO), so a running timer can tick without double-counting. */
  asOf: string;
  showQuestPicker?: boolean;
}) {
  const [logOpen, setLogOpen] = useState(false);
  const toggle = useAction(toggleTask);
  const update = useAction(updateTask);
  const remove = useAction(deleteTask);

  return (
    <li
      className={cn(
        "group hover:bg-muted/40 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors",
        task.done && "opacity-55",
      )}
    >
      <Checkbox
        checked={task.done}
        disabled={toggle.pending}
        aria-label={task.done ? "Mark as not done" : "Mark as done"}
        onCheckedChange={(checked) => toggle.run({ id: task.id, done: checked === true })}
      />

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", task.done && "line-through")}>{task.title}</p>
        {task.estimateMinutes !== null && (
          <p className="text-muted-foreground text-xs">
            est. {formatDuration(task.estimateMinutes)}
          </p>
        )}
      </div>

      {showQuestPicker && (
        <QuestPicker
          value={task.questId}
          quests={quests}
          disabled={update.pending}
          onChange={(questId) => update.run({ id: task.id, questId })}
        />
      )}

      <TimerButton
        taskId={task.id}
        trackedMinutes={task.trackedMinutes}
        running={task.isRunning}
        asOf={asOf}
        disabled={task.done}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
            aria-label="Task actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setLogOpen(true)}>
            <Clock className="size-4" /> Log time manually
          </DropdownMenuItem>
          {task.plannedDate === null ? (
            <DropdownMenuItem
              onSelect={() => update.run({ id: task.id, plannedDate: dateKey ?? null })}
              disabled={!dateKey}
            >
              <CalendarPlus className="size-4" /> Move to today
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => update.run({ id: task.id, plannedDate: null })}>
              <CalendarPlus className="size-4" /> Move to backlog
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            disabled={remove.pending}
            onSelect={() => remove.run(task.id)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogTimeDialog
        taskId={task.id}
        taskTitle={task.title}
        dateKey={dateKey}
        open={logOpen}
        onOpenChange={setLogOpen}
      />
    </li>
  );
}
