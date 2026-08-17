import Link from "next/link";
import { formatHours, formatPercent } from "@/lib/duration";
import { ADMIN_COLOR } from "@/lib/quest-colors";
import type { SplitSummary } from "../domain";
import { ADMIN_LABEL } from "../domain";

/**
 * Where the quest hours actually went. Admin is rendered in the same list, last
 * and in grey, so the comparison is immediate rather than a separate section.
 */
export function QuestBreakdown({ summary }: { summary: SplitSummary }) {
  const rows = [
    ...summary.perQuest.map((slice) => ({
      key: slice.questId ?? ADMIN_LABEL,
      href: slice.questId ? `/quests/${slice.questId}` : null,
      name: slice.name,
      color: slice.color,
      minutes: slice.minutes,
      share: slice.share,
    })),
    {
      key: ADMIN_LABEL,
      href: null,
      name: ADMIN_LABEL,
      color: ADMIN_COLOR,
      minutes: summary.adminMinutes,
      share: summary.adminShare,
    },
  ].filter((row) => row.minutes > 0);

  if (rows.length === 0) return null;

  return (
    // Headless on purpose: the callers that show this already say what window
    // it covers, and two headings stacked read as a mistake.
    <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              {row.href ? (
                <Link href={row.href} className="truncate hover:underline">
                  {row.name}
                </Link>
              ) : (
                <span className="text-muted-foreground truncate">{row.name}</span>
              )}
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {formatHours(row.minutes)} · {formatPercent(row.share)}
              </span>
            </div>

            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(1, row.share * 100)}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
          </li>
        ))}
    </ul>
  );
}
