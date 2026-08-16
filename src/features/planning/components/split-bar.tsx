import { cn } from "@/lib/utils";

/**
 * The quest/admin split as one bar. Same visual grammar as Insights, so the
 * number you *plan* and the number you *get* are obviously the same
 * measurement — which is the comparison the whole product is about.
 *
 * Takes shares rather than minutes because the two callers measure different
 * things: the ritual projects from estimates (falling back to task counts),
 * while the day summary draws planned and tracked on one shared scale. Shares
 * need not sum to 1 — what's left is the unfilled track.
 */
export function SplitBar({
  questShare,
  adminShare,
  label,
  muted = false,
  className,
}: {
  questShare: number;
  adminShare: number;
  /** Read out instead of the raw percentages when the bar means something more specific. */
  label?: string;
  /** Draws the bar as an outline — for a projection standing next to reality. */
  muted?: boolean;
  className?: string;
}) {
  const empty = questShare + adminShare <= 0;

  return (
    <div
      className={cn("bg-muted flex h-2 w-full overflow-hidden rounded-full", className)}
      role="img"
      aria-label={
        label ??
        (empty
          ? "Nothing to split yet"
          : `${Math.round(questShare * 100)}% quest, ${Math.round(adminShare * 100)}% admin`)
      }
    >
      <div
        className={cn("bg-quest h-full transition-[width]", muted && "opacity-40")}
        style={{ width: `${Math.min(100, questShare * 100)}%` }}
      />
      <div
        className={cn("bg-admin h-full transition-[width]", muted && "opacity-40")}
        style={{ width: `${Math.min(100, adminShare * 100)}%` }}
      />
    </div>
  );
}
