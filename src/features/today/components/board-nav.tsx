import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * The board's own toolbar. Days are a URL parameter rather than client state,
 * so any day is linkable and the page stays a server component — the morning
 * ritual often happens the evening before.
 */
export function BoardNav({
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
      <Button
        asChild
        variant={isToday ? "secondary" : "outline"}
        size="sm"
        className="h-8 gap-1.5"
      >
        <Link href="/today">
          <CalendarCheck className="size-3.5" />
          Today
        </Link>
      </Button>

      <Button asChild variant="ghost" size="icon" className="size-8">
        <Link href={`/today?date=${previousKey}`} aria-label="Previous day">
          <ChevronLeft className="size-4" />
        </Link>
      </Button>

      <Button asChild variant="ghost" size="icon" className="size-8">
        <Link href={`/today?date=${nextKey}`} aria-label="Next day">
          <ChevronRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
