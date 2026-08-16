import Link from "next/link";
import { QuestDot } from "@/components/quest-dot";
import { Progress } from "@/components/ui/progress";
import { targetProgress } from "@/features/insights/domain";
import { formatHours } from "@/lib/duration";
import type { QuestWithStats } from "../queries";
import { QuestHealthBadge } from "./quest-health-badge";
import { QuestMenu } from "./quest-menu";

/**
 * A quest at a glance: colour, status chip, hours in the current window and —
 * if a weekly target is set — how close it is. The hours number is the point;
 * everything else is context around it.
 */
export function QuestCard({
  quest,
  rangeLabel,
}: {
  quest: QuestWithStats;
  rangeLabel: string;
}) {
  const progress = targetProgress(quest.trackedMinutes, quest.targetHoursWeek);

  return (
    <article className="hover:border-foreground/20 rounded-xl border p-4 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/quests/${quest.id}`}
            className="flex items-center gap-2 font-medium hover:underline"
          >
            <QuestDot color={quest.color} />
            <span className="truncate">{quest.name}</span>
          </Link>

          <p className="text-muted-foreground mt-1 text-xs">
            {quest.openTaskCount === 0
              ? "No open tasks"
              : `${quest.openTaskCount} open task${quest.openTaskCount === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <QuestHealthBadge health={quest.health} />
          <QuestMenu quest={quest} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          {formatHours(quest.trackedMinutes)}
        </span>
        <span className="text-muted-foreground text-xs">{rangeLabel}</span>
      </div>

      {progress !== null && quest.targetHoursWeek !== null && (
        <div className="mt-3 space-y-1.5">
          <Progress value={progress * 100} className="h-1.5" />
          <p className="text-muted-foreground text-xs">
            Target {quest.targetHoursWeek}h/week
          </p>
        </div>
      )}
    </article>
  );
}
