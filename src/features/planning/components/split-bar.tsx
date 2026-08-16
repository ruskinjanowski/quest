import { cn } from "@/lib/utils";
import type { DayProjection } from "../domain";

/**
 * The projected quest/admin split as one bar. Same visual grammar as Insights,
 * so the number you *plan* and the number you *get* are obviously the same
 * measurement — which is the comparison the whole product is about.
 */
export function SplitBar({
  projection,
  className,
}: {
  projection: DayProjection;
  className?: string;
}) {
  const { questShare, adminShare, plannedMinutes } = projection;

  return (
    <div
      className={cn("bg-muted flex h-2 w-full overflow-hidden rounded-full", className)}
      role="img"
      aria-label={
        plannedMinutes > 0
          ? `${Math.round(questShare * 100)}% quest, ${Math.round(adminShare * 100)}% admin`
          : "Nothing estimated yet"
      }
    >
      <div
        className="bg-quest h-full transition-[width]"
        style={{ width: `${questShare * 100}%` }}
      />
      <div
        className="bg-admin h-full transition-[width]"
        style={{ width: `${adminShare * 100}%` }}
      />
    </div>
  );
}
