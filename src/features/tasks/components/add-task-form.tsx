"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  QuestPicker,
  type QuestOption,
} from "@/features/quests/components/quest-picker";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";
import { createTask } from "../actions";
import { EstimatePicker } from "./estimate-picker";

/**
 * Inline capture, in two shapes.
 *
 * `card` is the general one at the top of a list: pick the quest yourself, and
 * new tasks default to Admin (PRODUCT_PLAN §4) — mildly provocative and honest,
 * work only counts toward a quest if you say so.
 *
 * `inline` sits at the foot of a quest's own group, where the quest is already
 * decided by where you're typing. That removes the app's most-repeated step
 * from the most common path, and makes the page teach its own model: you add
 * work *to a quest*, not to a day.
 */
export function AddTaskForm({
  quests,
  plannedDate = null,
  placeholder = "Add a task…",
  defaultQuestId = null,
  variant = "card",
}: {
  quests: readonly QuestOption[];
  /** `null` captures into the backlog. */
  plannedDate?: string | null;
  placeholder?: string;
  /** Pre-selected quest. In `inline` it is the only quest this form can file to. */
  defaultQuestId?: string | null;
  variant?: "card" | "inline";
}) {
  const [title, setTitle] = useState("");
  const [questId, setQuestId] = useState<string | null>(defaultQuestId);
  const [estimateMinutes, setEstimateMinutes] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const inline = variant === "inline";

  const { run, pending } = useAction(createTask, {
    onSuccess: () => {
      setTitle("");
      // Quest and estimate survive the submit: capturing three tasks for the
      // same quest in a row shouldn't mean re-picking it three times.
      inputRef.current?.focus();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    run({ title: trimmed, questId, plannedDate, estimateMinutes });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 transition-colors",
        inline
          ? "text-muted-foreground focus-within:text-foreground rounded-lg px-2 py-1"
          : "focus-within:border-ring rounded-lg border border-dashed px-2 py-1.5",
      )}
    >
      <Plus className={cn("size-4 shrink-0", inline ? "opacity-60" : "text-muted-foreground")} />

      <Input
        ref={inputRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={placeholder}
        aria-label={inline ? placeholder : "Task title"}
        className={cn(
          "h-8 min-w-0 flex-1 basis-40 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent",
          inline && "text-muted-foreground placeholder:text-muted-foreground",
        )}
      />

      <div className="flex items-center gap-2">
        <EstimatePicker value={estimateMinutes} onChange={setEstimateMinutes} />

        {!inline && (
          <QuestPicker value={questId} quests={quests} onChange={setQuestId} />
        )}

        {/* Inline rows stay quiet until there is something to add; Enter
            submits either way. */}
        {(!inline || title.trim().length > 0) && (
          <Button type="submit" size="sm" disabled={pending || !title.trim()}>
            Add
          </Button>
        )}
      </div>
    </form>
  );
}
