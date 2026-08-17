import { cn } from "@/lib/utils";

/**
 * The quest/admin split as one bar, used identically on the board, on Home and
 * on a quest — so the number you *plan* and the number you *get* are obviously
 * the same measurement, which is the comparison the whole product is about.
 *
 * Takes shares rather than minutes: callers measure different things, and the
 * two need not sum to 1 — what's left is the unfilled track.
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
  /** Draws the bar faded — for a projection standing in for finished work. */
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
        className={cn("bg-quest h-full transition-[width]", muted && "opacity-50")}
        style={{ width: `${Math.min(100, questShare * 100)}%` }}
      />
      <div
        className={cn("bg-admin h-full transition-[width]", muted && "opacity-50")}
        style={{ width: `${Math.min(100, adminShare * 100)}%` }}
      />
    </div>
  );
}
