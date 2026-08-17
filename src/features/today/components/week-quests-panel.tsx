import Link from "next/link";
import { QuestDot } from "@/components/quest-dot";
import { Progress } from "@/components/ui/progress";
import { targetProgress } from "@/features/insights/domain";
import type { QuestWithStats } from "@/features/quests/queries";
import { formatDuration } from "@/lib/duration";

/**
 * Which quests this week is actually advancing.
 *
 * Where Sunsama puts "weekly objectives", Quest puts the quests themselves —
 * same job (keep the week's intent in view while you plan the day), stated in
 * the vocabulary this product is built on.
 */
export function WeekQuestsPanel({
  quests,
  scheduledByQuest,
}: {
  quests: readonly QuestWithStats[];
  /** Minutes planned on each quest across the visible days. */
  scheduledByQuest: ReadonlyMap<string, number>;
}) {
  if (quests.length === 0) {
    return (
      <p className="text-muted-foreground px-1 py-6 text-center text-xs text-balance">
        No active quests yet. <Link href="/quests" className="underline">Create one</Link> and
        the week gets something to aim at.
      </p>
    );
  }

  return (
    <ul className="space-y-3.5">
      {quests.map((quest) => {
        const progress = targetProgress(quest.bankedMinutes, quest.targetHoursWeek);
        const scheduled = scheduledByQuest.get(quest.id) ?? 0;

        return (
          <li key={quest.id}>
            <Link
              href={`/quests/${quest.id}`}
              className="group flex items-baseline justify-between gap-2"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium group-hover:underline">
                <QuestDot color={quest.color} />
                <span className="truncate">{quest.name}</span>
              </span>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {formatDuration(quest.bankedMinutes)}
              </span>
            </Link>

            {progress !== null && (
              <Progress value={progress * 100} className="mt-1.5 h-1" />
            )}

            <p className="text-muted-foreground/80 mt-1 text-[11px]">
              {quest.targetHoursWeek !== null && `of ${quest.targetHoursWeek}h target · `}
              {scheduled > 0 ? `${formatDuration(scheduled)} planned` : "nothing planned"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
