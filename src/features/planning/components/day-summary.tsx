"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRunningElapsedMinutes } from "@/features/time-tracking/use-running-elapsed";
import {
  formatDuration,
  formatPercent,
  formatStopwatch,
  share,
} from "@/lib/duration";
import { projectDay, trackDay } from "../domain";

/**
 * A slim day strip: what the day has cost so far, how much of it advanced a
 * quest, and — below — its shape on a time axis.
 *
 * The live quest-vs-admin split already lives in the header counter, so this no
 * longer repeats it as a pair of bars; it states the day's total in one line and
 * hands the rest of the card to the timeline. Keeping the two in one card means
 * the number and the picture of the day share a frame.
 */
export function DaySummary({
  tasks,
  asOf,
  children,
}: {
  tasks: readonly {
    questId: string | null;
    estimateMinutes: number | null;
    trackedMinutes: number;
    isRunning: boolean;
  }[];
  /** Server render time (ISO) — the moment `trackedMinutes` was true. */
  asOf: string;
  /** The day's shape (the timeline), drawn beneath the summary line. */
  children?: ReactNode;
}) {
  const running = tasks.some((task) => task.isRunning);
  const elapsed = useRunningElapsedMinutes(asOf, running);

  // The running task's server total plus what's accrued since, so the tracked
  // figure grows in real time rather than at reload time.
  const live = tasks.map((task) =>
    task.isRunning
      ? { ...task, trackedMinutes: task.trackedMinutes + elapsed }
      : task,
  );

  const tracked = trackDay(live);
  const projection = projectDay(tasks);
  const questShare = share(tracked.questMinutes, tracked.totalMinutes);

  return (
    <Card className="gap-0 py-4">
      <CardContent className="space-y-4 px-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <p className="tabular-nums">
            <span className="font-medium">
              {running
                ? formatStopwatch(tracked.totalMinutes)
                : formatDuration(tracked.totalMinutes)}
            </span>{" "}
            <span className="text-muted-foreground">tracked today</span>
          </p>

          {tracked.totalMinutes > 0 && (
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">
                {formatPercent(questShare)}
              </span>{" "}
              on quests
            </p>
          )}

          {projection.plannedMinutes > 0 && (
            <p className="text-muted-foreground tabular-nums">
              {formatDuration(projection.plannedMinutes)} planned
            </p>
          )}
        </div>

        {children && <div>{children}</div>}
      </CardContent>
    </Card>
  );
}
