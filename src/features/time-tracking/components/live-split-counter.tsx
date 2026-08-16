"use client";

import { formatHours, formatStopwatch } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { useRunningElapsedMinutes } from "../use-running-elapsed";

/**
 * PRODUCT_PLAN 1.1 — the metric, ambient. The server hands over today's split
 * as of `asOf`; if a timer is running, this ticks the right side of it forward
 * locally rather than polling.
 *
 * The voice changes with the state. Idle, it speaks in hours (`1.2h`), matching
 * Insights — the scale you think in when you're reviewing. Running, both sides
 * switch to the stopwatch (`1:13:34`), because `1.2h` only moves once every six
 * minutes and a counter that sits still isn't ambient, it's decoration. The
 * frozen `:00` on the other side is the point: you can see at a glance which
 * bucket is filling.
 */
export function LiveSplitCounter({
  questMinutes,
  adminMinutes,
  asOf,
  running,
  runningIsQuest,
}: {
  questMinutes: number;
  adminMinutes: number;
  /** Server render time (ISO) — the moment the two figures above were true. */
  asOf: string;
  running: boolean;
  runningIsQuest: boolean;
}) {
  const elapsed = useRunningElapsedMinutes(asOf, running);

  // The server already counted the running entry up to `asOf`; only the
  // difference since then is added here.
  const liveQuest = questMinutes + (runningIsQuest ? elapsed : 0);
  const liveAdmin = adminMinutes + (runningIsQuest ? 0 : elapsed);
  const format = running ? formatStopwatch : formatHours;

  return (
    <div className="flex items-center gap-3 text-sm tabular-nums" aria-live="off">
      <Side
        minutes={liveQuest}
        label="quest"
        dotClassName="bg-quest"
        live={running && runningIsQuest}
        format={format}
      />
      <span className="text-muted-foreground/50">·</span>
      <Side
        minutes={liveAdmin}
        label="admin"
        dotClassName="bg-admin"
        live={running && !runningIsQuest}
        format={format}
      />
    </div>
  );
}

function Side({
  minutes,
  label,
  dotClassName,
  live,
  format,
}: {
  minutes: number;
  label: string;
  dotClassName: string;
  live: boolean;
  format: (minutes: number) => string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block size-2 rounded-full",
          dotClassName,
          // A pulse on the dot says "this one is moving" without waiting for
          // the digits to change.
          live && "motion-safe:animate-pulse",
        )}
      />
      <span className="font-medium">{format(minutes)}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
