import { AlertTriangle, Hourglass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration, formatPercent } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { DAY_CAPACITY_MINUTES, overloadMinutes, projectDay, workloadFor } from "../domain";
import { SplitBar } from "./split-bar";

/**
 * The day's shape, above the list: what you signed up for, what it will cost,
 * and how much of it advances a quest.
 *
 * Sunsama's workload warning is the honest half of daily planning — a list that
 * doesn't fit is a decision you should make in the morning, not discover at
 * 6pm — so the overload line is stated plainly rather than hidden in a colour.
 */
export function DaySummary({
  tasks,
  trackedMinutes,
  capacityMinutes = DAY_CAPACITY_MINUTES,
}: {
  tasks: readonly { questId: string | null; estimateMinutes: number | null }[];
  /** Actually tracked on this day so far — the reality check next to the plan. */
  trackedMinutes: number;
  capacityMinutes?: number;
}) {
  const projection = projectDay(tasks);
  const workload = workloadFor(projection.plannedMinutes, capacityMinutes);
  const over = overloadMinutes(projection.plannedMinutes, capacityMinutes);

  return (
    <Card className="gap-0 py-4">
      <CardContent className="space-y-3 px-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm">
            <span className="font-medium tabular-nums">
              {formatDuration(projection.plannedMinutes)}
            </span>{" "}
            <span className="text-muted-foreground">
              planned across {projection.taskCount}{" "}
              {projection.taskCount === 1 ? "task" : "tasks"}
            </span>
          </p>

          <p className="text-muted-foreground text-sm tabular-nums">
            {formatDuration(trackedMinutes)} tracked
          </p>
        </div>

        <SplitBar projection={projection} />

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span>
            <span className="text-foreground font-medium">
              {formatPercent(projection.questShare)}
            </span>{" "}
            of the plan advances a quest
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
            {WORKLOAD_NOTE[workload]}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const WORKLOAD_NOTE = {
  empty: "Nothing planned yet.",
  light: "A light day — room for one more quest task.",
  balanced: "A realistic day.",
  full: "A full day. This is about as much as fits.",
  over: "",
} as const;
