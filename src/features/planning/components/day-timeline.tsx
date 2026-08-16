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
 * three-column planner for an evening's work.
 *
 * The axis runs left-to-right across the full content width rather than down a
 * narrow column. A day is naturally horizontal, and the old vertical strip cost
 * the task list a third of the page to show 10px labels.
 *
 * Blocks are tracked time, coloured by quest — so the strip is a second view of
 * the same split the header counts, not a separate source of truth.
 */

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 19;

/**
 * Below this, a block is narrower than the shortest useful label and renders as
 * a bare colour bar — "Tea…" reads worse than a silent swatch. The full title
 * is still on the `title` attribute, and the task list right above says it in
 * full anyway; this strip is here to show the *shape* of the day.
 */
const LABEL_MIN_MINUTES = 45;

type Span = { startMinute: number; endMinute: number };

/**
 * Greedy interval packing: each span goes in the first lane it doesn't collide
 * with. Without this, concurrent blocks stack on top of each other and the
 * later one wins — a meeting and the work either side of it became unreadable.
 */
function packLanes<T extends Span>(spans: readonly T[]): T[][] {
  const lanes: T[][] = [];

  for (const span of [...spans].sort(
    (a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute,
  )) {
    const lane = lanes.find((candidate) => {
      const last = candidate[candidate.length - 1];
      return last !== undefined && last.endMinute <= span.startMinute;
    });

    if (lane) lane.push(span);
    else lanes.push([span]);
  }

  return lanes;
}

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
  const spanMinutes = (endHour - startHour) * 60;

  // Percentages rather than pixels-per-minute, so the strip simply fills
  // whatever width the page gives it.
  const left = (minute: number) => ((minute - originMinute) / spanMinutes) * 100;
  const width = (span: Span) =>
    ((span.endMinute - span.startMinute) / spanMinutes) * 100;

  const calendarLanes = packLanes(STUB_CALENDAR_EVENTS);
  const trackedLanes = packLanes(blocks);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-xl">
        {/* Hour ruler. The gridlines below hang off these same positions. */}
        <div className="relative h-4">
          {hours.map((hour) => (
            <span
              key={hour}
              className="text-muted-foreground absolute top-0 text-[11px] tabular-nums"
              style={{ left: `${left(hour * 60)}%` }}
            >
              {formatTimeOfDay(hour * 60)}
            </span>
          ))}
        </div>

        <div className="relative mt-1.5 flex flex-col gap-1">
          {hours.map((hour) => (
            <span
              key={hour}
              aria-hidden
              className="bg-border/60 absolute inset-y-0 w-px"
              style={{ left: `${left(hour * 60)}%` }}
            />
          ))}

          {calendarLanes.map((lane, index) => (
            <div key={`calendar-${index}`} className="relative h-7">
              {lane.map((event) => (
                <div
                  key={event.title}
                  title={`${event.title} · ${formatTimeOfDay(event.startMinute)}`}
                  className="bg-muted/70 text-muted-foreground absolute inset-y-0 flex items-center overflow-hidden rounded border border-dashed px-1.5 text-[11px]"
                  style={{ left: `${left(event.startMinute)}%`, width: `${width(event)}%` }}
                >
                  {event.endMinute - event.startMinute >= LABEL_MIN_MINUTES && (
                    <span className="truncate">{event.title}</span>
                  )}
                </div>
              ))}
            </div>
          ))}

          {trackedLanes.map((lane, index) => (
            <div key={`tracked-${index}`} className="relative h-7">
              {lane.map((block) => {
                // `color-mix` rather than appending an alpha suffix to a hex
                // string: Admin's colour is a CSS variable, and
                // `var(--admin)22` is not a colour.
                const color = questColorHex(block.questColor);

                return (
                  <div
                    key={block.id}
                    title={`${block.title} · ${formatTimeOfDay(block.startMinute)}`}
                    className={cn(
                      "absolute inset-y-0 flex items-center overflow-hidden rounded px-1.5 text-[11px]",
                    )}
                    style={{
                      left: `${left(block.startMinute)}%`,
                      // A few-second entry is still real tracked time; without a
                      // floor it renders as a bare 2px border and reads as a
                      // rendering artefact rather than a very short block.
                      width: `${width(block)}%`,
                      minWidth: 4,
                      backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)`,
                      borderLeft: `2px solid ${color}`,
                      boxShadow: block.running ? `0 0 0 1.5px ${color}` : undefined,
                    }}
                  >
                    {block.endMinute - block.startMinute >= LABEL_MIN_MINUTES && (
                      <span className="truncate">{block.title}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {trackedLanes.length === 0 && (
            <p className="text-muted-foreground relative py-1 text-xs">
              Nothing tracked yet today.
            </p>
          )}
        </div>

        <p className="text-muted-foreground mt-3 text-xs">
          Tracked time, coloured by quest. Dashed blocks are calendar events.
          Hover any block for its name.
        </p>
      </div>
    </div>
  );
}
