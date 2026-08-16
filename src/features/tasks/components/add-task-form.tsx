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
import { createTask } from "../actions";

/**
 * Inline capture. New tasks default to Admin (PRODUCT_PLAN §4) — mildly
 * provocative and honest: work only counts toward a quest if you say so.
 */
export function AddTaskForm({
  quests,
  plannedDate = null,
  placeholder = "Add a task…",
}: {
  quests: readonly QuestOption[];
  /** `null` captures into the backlog. */
  plannedDate?: string | null;
  placeholder?: string;
}) {
  const [title, setTitle] = useState("");
  const [questId, setQuestId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { run, pending } = useAction(createTask, {
    onSuccess: () => {
      setTitle("");
      inputRef.current?.focus();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    run({ title: trimmed, questId, plannedDate });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="focus-within:border-ring flex items-center gap-2 rounded-lg border border-dashed px-2 py-1.5 transition-colors"
    >
      <Plus className="text-muted-foreground size-4 shrink-0" />
      <Input
        ref={inputRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={placeholder}
        aria-label="Task title"
        className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <QuestPicker value={questId} quests={quests} onChange={setQuestId} />
      <Button type="submit" size="sm" disabled={pending || !title.trim()}>
        Add
      </Button>
    </form>
  );
}
