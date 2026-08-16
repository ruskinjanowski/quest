"use client";

import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAction } from "@/hooks/use-action";
import { formatClock, formatStopwatch } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { startTimer, stopTimer } from "../actions";
import { useRunningElapsedMinutes } from "../use-running-elapsed";

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

  // While running, the server-rendered total goes stale; count the difference.
  const elapsed = useRunningElapsedMinutes(asOf, running);

  const pending = start.pending || stop.pending;
  const displayMinutes = trackedMinutes + elapsed;
  const label = running ? "Stop timer" : "Start timer";

  return (
    <div className="flex items-center gap-1.5">
      {/* Fixed width, sized for the running form: gaining a `:ss` shouldn't
          shove the button under the cursor sideways. */}
      <span
        className={cn(
          "min-w-14 text-right text-xs tabular-nums",
          running ? "text-foreground font-medium" : "text-muted-foreground",
          displayMinutes < 1 && !running && "opacity-40",
        )}
      >
        {running ? formatStopwatch(displayMinutes) : formatClock(displayMinutes)}
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
