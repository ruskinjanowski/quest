import Link from "next/link";
import { QuestDot } from "@/components/quest-dot";
import { Progress } from "@/components/ui/progress";
import { targetProgress } from "@/features/insights/domain";
import { formatHours } from "@/lib/duration";
import { cn } from "@/lib/utils";
import type { QuestWithStats } from "../queries";
import { QuestHealthBadge } from "./quest-health-badge";
import { QuestMenu } from "./quest-menu";

/**
 * A quest at a glance: colour, status chip, hours in the current window and —
 * if a weekly target is set — how close it is. The hours number is the point;
 * everything else is context around it.
 *
 * The whole card is the link. It used to be just the title, which made a
 * card-shaped, card-sized thing that mostly wasn't clickable.
 */
export function QuestCard({
  quest,
  rangeLabel,
  nextTask,
}: {
  quest: QuestWithStats;
  rangeLabel: string;
  /** The next unfinished task on this quest, if there is one. */
  nextTask?: string;
}) {
  const progress = targetProgress(quest.bankedMinutes, quest.targetHoursWeek);

  return (
    <article className="hover:border-foreground/20 focus-within:border-foreground/20 relative rounded-xl border p-4 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-medium">
            <QuestDot color={quest.color} />
            {/* Stretched so the card is the target, while the menu and any
                other control on it stay clickable above the overlay. */}
            <Link
              href={`/quests/${quest.id}`}
              className="truncate after:absolute after:inset-0 after:content-['']"
            >
              {quest.name}
            </Link>
          </h3>

          <p className="text-muted-foreground mt-1 truncate text-xs">
            {nextTask
              ? `Next: ${nextTask}`
              : quest.openTaskCount === 0
                ? "No open tasks"
                : `${quest.openTaskCount} open task${quest.openTaskCount === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <QuestHealthBadge health={quest.health} />
          <QuestMenu quest={quest} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-2xl font-semibold tabular-nums",
            quest.bankedMinutes === 0 && "text-muted-foreground",
          )}
        >
          {formatHours(quest.bankedMinutes)}
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
