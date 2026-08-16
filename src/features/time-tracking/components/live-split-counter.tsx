"use client";

import { useEffect, useState } from "react";
import { formatHours } from "@/lib/duration";
import { ADMIN_COLOR } from "@/lib/quest-colors";

/**
 * PRODUCT_PLAN 1.1 — the metric, ambient. The server hands over today's split
 * as of render time; if a timer is running, this ticks the right side of the
 * split forward locally rather than polling.
 */
export function LiveSplitCounter({
  questMinutes,
  adminMinutes,
  runningSince,
  runningIsQuest,
}: {
  questMinutes: number;
  adminMinutes: number;
  /**
   * When a timer is running, the server's render time as an ISO string — the
   * point the two figures above were accurate at. `null` means nothing running.
   */
  runningSince: string | null;
  runningIsQuest: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!runningSince) return;

    const renderedAt = new Date(runningSince).getTime();
    const interval = setInterval(
      () => setElapsed(Math.max(0, (Date.now() - renderedAt) / 60_000)),
      1_000,
    );

    return () => clearInterval(interval);
  }, [runningSince]);

  // The server already counted the running entry up to render time; only the
  // difference since then is added here.
  const running = runningSince !== null;
  const liveQuest = questMinutes + (running && runningIsQuest ? elapsed : 0);
  const liveAdmin = adminMinutes + (running && !runningIsQuest ? elapsed : 0);

  return (
    <div className="flex items-center gap-3 text-sm tabular-nums" aria-live="off">
      <span className="flex items-center gap-1.5">
        <span className="bg-primary inline-block size-2 rounded-full" />
        <span className="font-medium">{formatHours(liveQuest)}</span>
        <span className="text-muted-foreground">quest</span>
      </span>
      <span className="text-muted-foreground/50">·</span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: ADMIN_COLOR }}
        />
        <span className="font-medium">{formatHours(liveAdmin)}</span>
        <span className="text-muted-foreground">admin</span>
      </span>
    </div>
  );
}
