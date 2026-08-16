"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAction } from "@/hooks/use-action";
import { formatClock } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { startTimer, stopTimer } from "../actions";

/**
 * Clockify-lite (PRODUCT_PLAN 0.4). Starting this timer stops whatever else was
 * running — that rule lives in the action, not here.
 */
export function TimerButton({
  taskId,
  trackedMinutes,
  running,
  asOf,
  disabled,
}: {
  taskId: string;
  /** Tracked total as of `asOf`, running time included. */
  trackedMinutes: number;
  running: boolean;
  /** Server render time (ISO). Re-renders reset the local count, so it can't double-count. */
  asOf: string;
  disabled?: boolean;
}) {
  const start = useAction(startTimer);
  const stop = useAction(stopTimer);
  const [sinceRenderMs, setSinceRenderMs] = useState(0);

  // While running, the server-rendered total goes stale; count the difference.
  useEffect(() => {
    if (!running) return;

    const renderedAt = new Date(asOf).getTime();
    const interval = setInterval(
      () => setSinceRenderMs(Math.max(0, Date.now() - renderedAt)),
      1_000,
    );

    return () => clearInterval(interval);
  }, [running, asOf]);

  const pending = start.pending || stop.pending;
  const displayMinutes = trackedMinutes + (running ? sinceRenderMs / 60_000 : 0);
  const label = running ? "Stop timer" : "Start timer";

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "text-xs tabular-nums",
          running ? "text-foreground font-medium" : "text-muted-foreground",
          displayMinutes < 1 && !running && "opacity-40",
        )}
      >
        {formatClock(displayMinutes)}
      </span>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant={running ? "default" : "ghost"}
            className="size-7"
            aria-label={label}
            disabled={disabled || pending}
            onClick={() => (running ? stop.run() : start.run(taskId))}
          >
            {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </div>
  );
}
