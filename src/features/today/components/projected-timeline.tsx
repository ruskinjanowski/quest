import { QuestDot } from "@/components/quest-dot";
import { projectStarts } from "@/features/tasks/domain";
import type { TaskRow } from "@/features/tasks/queries";
import { questColorHex } from "@/lib/quest-colors";
import { formatTimeOfDay } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * The day drawn on a clock — the honest replacement for a synced calendar.
 *
 * Every block here comes from the column's own order and estimates, so the list
 * and the picture of the day can't disagree. Nothing is fetched from anywhere:
 * no meetings, no fake events, and the Loom doesn't have to pretend otherwise.
 */

const FIRST_HOUR = 7;
const LAST_HOUR = 21;
const PIXELS_PER_HOUR = 44;

export function ProjectedTimeline({ tasks }: { tasks: readonly TaskRow[] }) {
  const starts = projectStarts(tasks);
  const hours = Array.from(
    { length: LAST_HOUR - FIRST_HOUR + 1 },
    (_, index) => FIRST_HOUR + index,
  );
  const top = FIRST_HOUR * 60;

  return (
    <div className="relative" style={{ height: hours.length * PIXELS_PER_HOUR }}>
      {hours.map((hour) => (
        <div
          key={hour}
          className="absolute inset-x-0 flex items-start gap-2"
          style={{ top: (hour * 60 - top) * (PIXELS_PER_HOUR / 60) }}
        >
          <span className="text-muted-foreground/70 w-9 shrink-0 text-[10px] tabular-nums">
            {formatTimeOfDay(hour * 60)}
          </span>
          <div className="border-border/60 mt-1.5 flex-1 border-t" />
        </div>
      ))}

      {tasks.map((task) => {
        const start = starts.get(task.id);
        if (start === undefined) return null;

        const length = task.estimateMinutes ?? 30;
        const offset = (start - top) * (PIXELS_PER_HOUR / 60);
        if (offset < 0 || start > LAST_HOUR * 60) return null;

        return (
          <div
            key={task.id}
            title={task.title}
            className={cn(
              "absolute right-0 left-11 overflow-hidden rounded-md border-l-2 px-1.5 py-0.5",
              task.done ? "opacity-60" : "",
            )}
            style={{
              top: offset,
              height: Math.max(16, length * (PIXELS_PER_HOUR / 60) - 2),
              borderLeftColor: questColorHex(task.questColor),
              backgroundColor: `color-mix(in oklab, ${questColorHex(task.questColor)} 14%, transparent)`,
            }}
          >
            <p className="flex items-center gap-1 truncate text-[11px] leading-tight">
              <QuestDot color={task.questColor} className="size-1.5" />
              <span className={cn("truncate", task.done && "line-through")}>
                {task.title}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
