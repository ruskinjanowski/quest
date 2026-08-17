import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addWeeks,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";

/**
 * All date maths in one pure module: no database, no React, no cookies — the
 * caller passes the time zone in. That makes "week starts Monday" a single
 * constant instead of an assumption scattered across queries and charts.
 */

/** PRODUCT_PLAN §5: week starts Monday. */
export const WEEK_STARTS_ON = 1 as const;

export type DateKey = string; // "yyyy-MM-dd" in the user's zone.

export type DateRange = {
  /** Inclusive instant. */
  start: Date;
  /** Exclusive instant. */
  end: Date;
};

/** "yyyy-MM-dd" as seen in `timeZone`. */
export function toDateKey(date: Date, timeZone: string): DateKey {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayKey(timeZone: string, now: Date = new Date()): DateKey {
  return toDateKey(now, timeZone);
}

export function isDateKey(value: string | undefined): value is DateKey {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Moves a date key by whole calendar days in `timeZone`. Calendar arithmetic,
 * not "+86400000ms": on a DST changeover a day is 23 or 25 hours long, and
 * "push this task to tomorrow" must still mean tomorrow.
 */
export function shiftDateKey(dateKey: DateKey, days: number, timeZone: string): DateKey {
  const [year, month, day] = dateKey.split("-").map(Number);
  const local = new TZDate(year, month - 1, day, timeZone);
  return toDateKey(new Date(addDays(local, days).getTime()), timeZone);
}

/** Midnight-to-midnight instants for a calendar day in `timeZone`. */
export function dayRange(dateKey: DateKey, timeZone: string): DateRange {
  const [year, month, day] = dateKey.split("-").map(Number);
  const local = new TZDate(year, month - 1, day, timeZone);
  return {
    start: new Date(startOfDay(local).getTime()),
    end: new Date(endOfDay(local).getTime() + 1),
  };
}

export function weekRange(timeZone: string, now: Date = new Date()): DateRange {
  const local = new TZDate(now.getTime(), timeZone);
  return {
    start: new Date(startOfWeek(local, { weekStartsOn: WEEK_STARTS_ON }).getTime()),
    end: new Date(endOfWeek(local, { weekStartsOn: WEEK_STARTS_ON }).getTime() + 1),
  };
}

/**
 * `count` consecutive day keys starting at `startKey` — the board's columns.
 * Built by calendar arithmetic so a DST changeover doesn't skip or repeat a day.
 */
export function dayKeysFrom(
  startKey: DateKey,
  count: number,
  timeZone: string,
): DateKey[] {
  return Array.from({ length: count }, (_, index) =>
    shiftDateKey(startKey, index, timeZone),
  );
}

/** Every day key in a range, oldest first — the week, for aggregation. */
export function dayKeysInRange(range: DateRange, timeZone: string): DateKey[] {
  const keys: DateKey[] = [];
  let key = toDateKey(range.start, timeZone);
  const last = toDateKey(new Date(range.end.getTime() - 1), timeZone);

  while (key <= last) {
    keys.push(key);
    key = shiftDateKey(key, 1, timeZone);
  }

  return keys;
}

/** The trailing `count` weeks, oldest first — the shape the trend chart wants. */
export function trailingWeeks(
  count: number,
  timeZone: string,
  now: Date = new Date(),
): (DateRange & { label: string })[] {
  const current = new TZDate(now.getTime(), timeZone);

  return Array.from({ length: count }, (_, index) => {
    const weekStart = startOfWeek(subWeeks(current, count - 1 - index), {
      weekStartsOn: WEEK_STARTS_ON,
    });
    const weekEnd = startOfWeek(addWeeks(weekStart, 1), { weekStartsOn: WEEK_STARTS_ON });

    return {
      start: new Date(weekStart.getTime()),
      end: new Date(weekEnd.getTime()),
      label: new Intl.DateTimeFormat("en-GB", {
        timeZone,
        day: "numeric",
        month: "short",
      }).format(weekStart),
    };
  });
}

/**
 * A window expressed as day keys rather than instants.
 *
 * Tasks carry a `date` column, not a timestamp, so every aggregation compares
 * calendar days. Converting once here keeps `>= fromKey AND <= toKey` the only
 * shape a query ever needs.
 */
export type KeyRange = { fromKey: DateKey; toKey: DateKey; dateKeys: DateKey[] };

export function keyRange(range: DateRange, timeZone: string): KeyRange {
  const dateKeys = dayKeysInRange(range, timeZone);
  return { fromKey: dateKeys[0], toKey: dateKeys[dateKeys.length - 1], dateKeys };
}

export function weekKeys(timeZone: string, now: Date = new Date()): KeyRange {
  return keyRange(weekRange(timeZone, now), timeZone);
}

/**
 * The last `count` days, ending today.
 *
 * Used wherever the question is "how have I been doing lately" rather than
 * "what does this calendar week contain". On a Monday morning the calendar
 * week is one day old and every quest looks abandoned — which says something
 * about the calendar, not about the week's work. Week-over-week *series* still
 * use `trailingWeekKeys`, where the Monday boundary is the whole point.
 */
export function rollingDayKeys(
  count: number,
  timeZone: string,
  now: Date = new Date(),
): KeyRange {
  const today = todayKey(timeZone, now);
  const dateKeys = dayKeysFrom(shiftDateKey(today, -(count - 1), timeZone), count, timeZone);

  return { fromKey: dateKeys[0], toKey: dateKeys[dateKeys.length - 1], dateKeys };
}

/** The trailing `count` weeks as day keys, oldest first — the trend chart's shape. */
export function trailingWeekKeys(
  count: number,
  timeZone: string,
  now: Date = new Date(),
): (KeyRange & { label: string })[] {
  return trailingWeeks(count, timeZone, now).map((week) => ({
    label: week.label,
    ...keyRange(week, timeZone),
  }));
}

export function formatDayLabel(dateKey: DateKey, timeZone: string): string {
  const { start } = dayRange(dateKey, timeZone);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(start);
}

/**
 * "16 Aug" straight from a date key. No time zone involved: the key already
 * names a calendar day, and turning it back into an instant to format it is
 * how a label ends up a day out.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDateKey(dateKey: DateKey): string {
  const [, month, day] = dateKey.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? ""}`.trim();
}

/** "Monday" — the day-column headline. */
export function formatWeekday(dateKey: DateKey, timeZone: string): string {
  const { start } = dayRange(dateKey, timeZone);
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long" }).format(start);
}

/** "17 August" — the line under it. */
export function formatDayAndMonth(dateKey: DateKey, timeZone: string): string {
  const { start } = dayRange(dateKey, timeZone);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "long",
  }).format(start);
}

/**
 * What to call a day in a heading: "Today" / "Tomorrow" / "Yesterday" when the
 * relative name is the clearer one, otherwise its weekday name.
 */
export function dayHeading(
  dateKey: DateKey,
  todayDateKey: DateKey,
  timeZone: string,
): string {
  if (dateKey === todayDateKey) return "Today";
  if (dateKey === shiftDateKey(todayDateKey, 1, timeZone)) return "Tomorrow";
  if (dateKey === shiftDateKey(todayDateKey, -1, timeZone)) return "Yesterday";

  const { start } = dayRange(dateKey, timeZone);
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long" }).format(start);
}

/** "09:00" — the timeline axis's voice. */
export function formatTimeOfDay(minuteOfDay: number): string {
  const safe = Math.max(0, Math.round(minuteOfDay));
  const hours = Math.floor(safe / 60) % 24;
  return `${String(hours).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

/**
 * "9:30 am" — the voice on a task card. Twelve-hour on purpose: the projected
 * start is meant to be read at a glance, the way a diary entry is.
 */
export function formatStartTime(minuteOfDay: number): string {
  const safe = Math.max(0, Math.round(minuteOfDay));
  const hours24 = Math.floor(safe / 60) % 24;
  const suffix = hours24 < 12 ? "am" : "pm";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  return `${hours12}:${String(safe % 60).padStart(2, "0")} ${suffix}`;
}

export function formatRangeLabel(range: DateRange, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
  });
  const lastInstant = new Date(range.end.getTime() - 1);
  return `${formatter.format(range.start)} – ${formatter.format(lastInstant)}`;
}
