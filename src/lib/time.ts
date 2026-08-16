import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
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

export type Timeframe = "week" | "month" | "all";

export const TIMEFRAMES: readonly { value: Timeframe; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
] as const;

export function isTimeframe(value: string | undefined): value is Timeframe {
  return value === "week" || value === "month" || value === "all";
}

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

export function monthRange(timeZone: string, now: Date = new Date()): DateRange {
  const local = new TZDate(now.getTime(), timeZone);
  return {
    start: new Date(startOfMonth(local).getTime()),
    end: new Date(endOfMonth(local).getTime() + 1),
  };
}

/** Everything ever tracked — still a range, so every query takes the same shape. */
export function allTimeRange(now: Date = new Date()): DateRange {
  return { start: new Date(0), end: new Date(now.getTime() + 60_000) };
}

export function rangeForTimeframe(
  timeframe: Timeframe,
  timeZone: string,
  now: Date = new Date(),
): DateRange {
  switch (timeframe) {
    case "week":
      return weekRange(timeZone, now);
    case "month":
      return monthRange(timeZone, now);
    case "all":
      return allTimeRange(now);
  }
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

/** "09:00" in the user's zone — the timeline's voice. */
export function formatTimeOfDay(minuteOfDay: number): string {
  const safe = Math.max(0, Math.round(minuteOfDay));
  const hours = Math.floor(safe / 60) % 24;
  return `${String(hours).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
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
