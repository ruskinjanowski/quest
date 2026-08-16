import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Moving between days. A planner that can only ever show today can't be used
 * the evening before, and can't show you what you left behind yesterday —
 * which are two of the three moments the ritual actually happens in.
 *
 * The day lives in the URL rather than in state, so every day is linkable and
 * the page stays a server component.
 */
export function DayNav({
  previousKey,
  nextKey,
  isToday,
}: {
  previousKey: string;
  nextKey: string;
  isToday: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="size-8" asChild>
        <Link href={`/today?date=${previousKey}`} aria-label="Previous day">
          <ChevronLeft className="size-4" />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={cn("px-2", isToday && "pointer-events-none opacity-40")}
        asChild
      >
        <Link href="/today" aria-disabled={isToday} tabIndex={isToday ? -1 : undefined}>
          Today
        </Link>
      </Button>

      <Button variant="ghost" size="icon" className="size-8" asChild>
        <Link href={`/today?date=${nextKey}`} aria-label="Next day">
          <ChevronRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
