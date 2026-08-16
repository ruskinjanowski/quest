import { AlertTriangle, Hourglass } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration, formatPercent } from "@/lib/duration";
import { cn } from "@/lib/utils";
import {
  DAY_CAPACITY_MINUTES,
  overloadMinutes,
  projectDay,
  trackDay,
  workloadFor,
} from "../domain";
import { SplitBar } from "./split-bar";

/**
 * The day's shape, above the list: what you signed up for, what it has cost so
 * far, and how much of either advances a quest.
 *
 * The two bars share one scale (the larger of planned and tracked), so the
 * tracked bar visibly fills toward the planned one. They used to be a single
 * bar over estimates alone, which meant a day with real tracked hours on it
 * could still announce "0% of the plan advances a quest" directly beneath a
 * header counting those hours — two measurements, one label, no way to tell.
 *
 * Sunsama's workload warning is the honest half of daily planning — a list that
 * doesn't fit is a decision you should make in the morning, not discover at
 * 6pm — so the overload line is stated plainly rather than hidden in a colour.
 */
export function DaySummary({
  tasks,
  capacityMinutes = DAY_CAPACITY_MINUTES,
  children,
}: {
  tasks: readonly {
    questId: string | null;
    estimateMinutes: number | null;
    trackedMinutes: number;
  }[];
  capacityMinutes?: number;
  /** The day's shape, drawn under the same rule as its numbers. */
  children?: ReactNode;
}) {
  const projection = projectDay(tasks);
  const tracked = trackDay(tasks);
  const workload = workloadFor(projection.plannedMinutes, capacityMinutes);
  const over = overloadMinutes(projection.plannedMinutes, capacityMinutes);

  // One scale for both bars, so their lengths are comparable rather than each
  // being normalised to its own total.
  const scale = Math.max(projection.plannedMinutes, tracked.totalMinutes, 1);

  return (
    <Card className="gap-0 py-4">
      <CardContent className="space-y-3 px-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <p>
            <span className="font-medium tabular-nums">
              {projection.plannedMinutes > 0
                ? formatDuration(projection.plannedMinutes)
                : projection.taskCount}
            </span>{" "}
            <span className="text-muted-foreground">
              {projection.plannedMinutes > 0
                ? `planned across ${projection.taskCount} ${projection.taskCount === 1 ? "task" : "tasks"}`
                : `${projection.taskCount === 1 ? "task" : "tasks"} planned, none estimated`}
            </span>
          </p>

          <p className="tabular-nums">
            <span className="font-medium">{formatDuration(tracked.totalMinutes)}</span>{" "}
            <span className="text-muted-foreground">tracked</span>
          </p>
        </div>

        <div className="space-y-1.5">
          {projection.plannedMinutes > 0 && (
            <BarRow
              label="Planned"
              questShare={projection.questMinutes / scale}
              adminShare={projection.adminMinutes / scale}
              muted
              srLabel={`Planned: ${formatDuration(projection.questMinutes)} on quests, ${formatDuration(projection.adminMinutes)} on admin`}
            />
          )}

          <BarRow
            label="Tracked"
            questShare={tracked.questMinutes / scale}
            adminShare={tracked.adminMinutes / scale}
            srLabel={`Tracked: ${formatDuration(tracked.questMinutes)} on quests, ${formatDuration(tracked.adminMinutes)} on admin`}
          />
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span>
            <span className="text-foreground font-medium">
              {formatPercent(projection.questShare)}
            </span>{" "}
            {projection.basis === "estimates"
              ? "of the plan advances a quest"
              : `of today's tasks advance a quest (${projection.questTaskCount} of ${projection.taskCount})`}
          </span>

          {projection.unestimatedCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Hourglass className="size-3" />
              {projection.unestimatedCount} without an estimate
            </span>
          )}
        </div>

        {over > 0 ? (
          <p className="text-destructive flex items-center gap-1.5 text-xs">
            <AlertTriangle className="size-3.5 shrink-0" />
            {formatDuration(over)} more than a {formatDuration(capacityMinutes)} day —
            something here is going to slip.
          </p>
        ) : (
          <p
            className={cn(
              "text-muted-foreground text-xs",
              workload === "full" && "text-foreground",
            )}
          >
            {projection.basis === "tasks"
              ? "Estimate a few of these to see what the day actually costs."
              : WORKLOAD_NOTE[workload]}
          </p>
        )}

        {children && <div className="border-t pt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}

function BarRow({
  label,
  questShare,
  adminShare,
  srLabel,
  muted,
}: {
  label: string;
  questShare: number;
  adminShare: number;
  srLabel: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-muted-foreground w-14 shrink-0 text-[10px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <SplitBar
        questShare={questShare}
        adminShare={adminShare}
        muted={muted}
        label={srLabel}
      />
    </div>
  );
}

const WORKLOAD_NOTE = {
  empty: "Nothing planned yet.",
  light: "A light day — room for one more quest task.",
  balanced: "A realistic day.",
  full: "A full day. This is about as much as fits.",
  over: "",
} as const;
