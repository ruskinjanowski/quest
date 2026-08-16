import { questColorHex } from "@/lib/quest-colors";
import { formatTimeOfDay } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { DayBlock } from "../queries";
import { STUB_CALENDAR_EVENTS } from "./calendar-events-stub";

/**
 * The day on a time axis (PRODUCT_PLAN 1.4, the read-only variant).
 *
 * Deliberately not draggable: §3 judged drag-and-drop the most expensive
 * interaction in the category and the least related to the product's actual
 * claim. Rendering the day gives most of the visual credibility of a
 * three-column planner for an evening's work, and the layout leaves room for
 * dragging later without restructuring.
 *
 * Blocks are tracked time, coloured by quest — so the column is a second view
 * of the same split the header counts, not a separate source of truth.
 */

const PX_PER_MINUTE = 0.75;
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 19;

export function DayTimeline({ blocks }: { blocks: readonly DayBlock[] }) {
  const earliest = Math.min(
    DEFAULT_START_HOUR * 60,
    ...blocks.map((block) => block.startMinute),
    ...STUB_CALENDAR_EVENTS.map((event) => event.startMinute),
  );
  const latest = Math.max(
    DEFAULT_END_HOUR * 60,
    ...blocks.map((block) => block.endMinute),
    ...STUB_CALENDAR_EVENTS.map((event) => event.endMinute),
  );

  const startHour = Math.floor(earliest / 60);
  const endHour = Math.ceil(latest / 60);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const originMinute = startHour * 60;

  const offset = (minute: number) => (minute - originMinute) * PX_PER_MINUTE;

  return (
    <div className="relative" style={{ height: (endHour - startHour) * 60 * PX_PER_MINUTE }}>
      {hours.map((hour) => (
        <div
          key={hour}
          className="absolute inset-x-0 flex items-start gap-2"
          style={{ top: offset(hour * 60) }}
        >
          <span className="text-muted-foreground w-8 shrink-0 text-[10px] tabular-nums">
            {formatTimeOfDay(hour * 60)}
          </span>
          <span className="border-border/50 mt-1.5 flex-1 border-t" />
        </div>
      ))}

      <div className="absolute inset-y-0 right-0 left-10">
        {STUB_CALENDAR_EVENTS.map((event) => (
          <div
            key={event.title}
            className="bg-muted/60 text-muted-foreground absolute inset-x-0 overflow-hidden rounded border border-dashed px-1.5 py-0.5 text-[10px]"
            style={{
              top: offset(event.startMinute),
              height: Math.max(14, (event.endMinute - event.startMinute) * PX_PER_MINUTE),
            }}
          >
            <span className="truncate">{event.title}</span>
          </div>
        ))}

        {blocks.map((block) => {
          const hex = questColorHex(block.questColor);
          const height = Math.max(14, (block.endMinute - block.startMinute) * PX_PER_MINUTE);

          return (
            <div
              key={block.id}
              title={`${block.title} · ${formatTimeOfDay(block.startMinute)}`}
              className={cn(
                "absolute right-0 left-6 overflow-hidden rounded px-1.5 py-0.5 text-[10px] leading-tight",
                block.running && "ring-primary ring-2",
              )}
              style={{
                top: offset(block.startMinute),
                height,
                backgroundColor: `${hex}22`,
                borderLeft: `2px solid ${hex}`,
              }}
            >
              <span className="line-clamp-2">{block.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
