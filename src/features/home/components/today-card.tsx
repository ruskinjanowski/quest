import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QuestDot } from "@/components/quest-dot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DaySummary } from "@/features/tasks/domain";
import { formatClock, formatDuration } from "@/lib/duration";

/**
 * Today at a glance, for someone who hasn't opened the board yet: how much is
 * committed, how much is done, and which quests the day is actually about.
 */
export function TodayCard({
  summary,
  byQuest,
}: {
  summary: DaySummary;
  byQuest: readonly { name: string; color: string | null; minutes: number }[];
}) {
  const progress =
    summary.plannedMinutes > 0
      ? Math.min(100, (summary.actualMinutes / summary.plannedMinutes) * 100)
      : 0;

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Today</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {summary.taskCount === 0 ? (
          <p className="text-muted-foreground text-sm text-balance">
            Nothing planned yet. Open the board and decide which quests today moves.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-2xl font-semibold tabular-nums">
                  {formatDuration(summary.plannedMinutes)}
                </span>{" "}
                <span className="text-muted-foreground">
                  planned across {summary.taskCount} task
                  {summary.taskCount === 1 ? "" : "s"}
                </span>
              </p>

              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-quest h-full rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {summary.doneCount} of {summary.taskCount} done
                {summary.actualMinutes > 0 &&
                  ` · ${formatDuration(summary.actualMinutes)} banked`}
              </p>
            </div>

            <ul className="space-y-1.5">
              {byQuest.map((row) => (
                <li
                  key={row.name}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <QuestDot color={row.color} />
                    <span className="truncate">{row.name}</span>
                  </span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {formatClock(row.minutes)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <Link
          href="/today"
          className="text-foreground inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Open today <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
