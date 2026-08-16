"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { QuestDot } from "@/components/quest-dot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  QuestPicker,
  type QuestOption,
} from "@/features/quests/components/quest-picker";
import { useAction } from "@/hooks/use-action";
import { formatStopwatch } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { startQuickTimer, stopTimer } from "../actions";
import { useRunningElapsedMinutes } from "../use-running-elapsed";

/**
 * The timer-first entry point on Today (PRODUCT_PLAN 0.4, Option A). This is the
 * one action the product is really about — start tracking time against a quest —
 * so it sits at the top and reads like Clockify: say what you're doing, pick the
 * quest it advances, go.
 *
 * There is no separate "quick task" concept: starting here creates a task under
 * the hood (`startQuickTimer`), because every time entry hangs off a task and
 * the day's list should show what you actually worked on.
 */
export type RunningState = {
  taskTitle: string;
  questName: string | null;
  questColor: string | null;
  /** ISO — when the running entry began. */
  startedAt: string;
};

export function TimerBar({
  quests,
  dateKey,
  asOf,
  running,
}: {
  quests: readonly QuestOption[];
  /** Which day a freshly started task lands on. */
  dateKey: string;
  /** Server render time (ISO) — the running clock ticks from here. */
  asOf: string;
  running: RunningState | null;
}) {
  return (
    <Card className="px-4 py-3">
      {running ? (
        <RunningBar running={running} asOf={asOf} />
      ) : (
        <IdleBar quests={quests} dateKey={dateKey} />
      )}
    </Card>
  );
}

function IdleBar({
  quests,
  dateKey,
}: {
  quests: readonly QuestOption[];
  dateKey: string;
}) {
  const [title, setTitle] = useState("");
  const [questId, setQuestId] = useState<string | null>(null);

  const { run, pending } = useAction(startQuickTimer, {
    // The quest survives so tracking three things on one quest in a row doesn't
    // mean re-picking it each time; the description clears, like Clockify.
    onSuccess: () => setTitle(""),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    run({ title: trimmed, questId, dateKey });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What are you working on?"
        aria-label="What are you working on?"
        className="h-9 min-w-0 flex-1 basis-48 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0 md:text-base dark:bg-transparent"
      />
      <QuestPicker value={questId} quests={quests} onChange={setQuestId} />
      <Button type="submit" disabled={pending || !title.trim()} className="gap-1.5">
        <Play className="size-4" />
        Start
      </Button>
    </form>
  );
}

function RunningBar({ running, asOf }: { running: RunningState; asOf: string }) {
  const stop = useAction(stopTimer);

  // Minutes already on the clock at `asOf`, plus what has ticked since.
  const baseMinutes = Math.max(
    0,
    (Date.parse(asOf) - Date.parse(running.startedAt)) / 60_000,
  );
  const elapsed = useRunningElapsedMinutes(asOf, true);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <QuestDot color={running.questColor} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={running.taskTitle}>
          {running.taskTitle}
        </p>
        <p className="text-muted-foreground text-xs">
          {running.questName ?? "Admin"}
        </p>
      </div>
      <span className="text-base font-medium tabular-nums">
        {formatStopwatch(baseMinutes + elapsed)}
      </span>
      <Button
        type="button"
        variant="default"
        className={cn("gap-1.5")}
        disabled={stop.pending}
        onClick={() => stop.run()}
      >
        <Pause className="size-4" />
        Stop
      </Button>
    </div>
  );
}
