"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  QuestPicker,
  type QuestOption,
} from "@/features/quests/components/quest-picker";
import { createTask } from "@/features/tasks/actions";
import { EstimatePicker } from "@/features/tasks/components/estimate-picker";
import { useAction } from "@/hooks/use-action";
import { formatClock } from "@/lib/duration";
import { cn } from "@/lib/utils";

/**
 * The row at the top of a day column: "+ Add task" on the left, the day's
 * planned total on the right — Sunsama's own header, which quietly answers
 * "how much have I committed to?" every time you go to add more.
 *
 * Collapsed until you click it, so a column of empty days stays quiet.
 */
export function AddTaskRow({
  quests,
  plannedDate,
  plannedMinutes,
  over,
}: {
  quests: readonly QuestOption[];
  plannedDate: string;
  /** Sum of the column's estimates, shown as `h:mm`. */
  plannedMinutes: number;
  /** The day is planned beyond its capacity — say so where the total is read. */
  over?: boolean;
}) {
  const [openForm, setOpenForm] = useState(false);
  const [title, setTitle] = useState("");
  const [questId, setQuestId] = useState<string | null>(null);
  const [estimateMinutes, setEstimateMinutes] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { run, pending } = useAction(createTask, {
    onSuccess: () => {
      setTitle("");
      // Quest and estimate survive the submit: adding three tasks to the same
      // quest shouldn't mean picking it three times.
      inputRef.current?.focus();
    },
  });

  if (!openForm) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpenForm(true);
          // Focus lands after the input exists; the state flush is synchronous
          // enough that a frame is all it takes.
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="text-muted-foreground hover:border-foreground/20 hover:text-foreground flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors"
      >
        <Plus className="size-4" />
        <span className="flex-1 text-left">Add task</span>
        <span className={cn("text-xs tabular-nums", over && "text-destructive")}>
          {plannedMinutes > 0 ? formatClock(plannedMinutes) : "—"}
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;
        run({ title: trimmed, questId, plannedDate, estimateMinutes });
      }}
      className="focus-within:border-ring bg-card space-y-2 rounded-lg border p-2"
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What needs doing?"
        aria-label="Task title"
        className="h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpenForm(false);
        }}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <QuestPicker value={questId} quests={quests} onChange={setQuestId} />
        <EstimatePicker value={estimateMinutes} onChange={setEstimateMinutes} />

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setOpenForm(false)}
          >
            Done
          </Button>
          <Button type="submit" size="sm" className="h-7 px-2.5 text-xs" disabled={pending || !title.trim()}>
            Add
          </Button>
        </div>
      </div>
    </form>
  );
}
