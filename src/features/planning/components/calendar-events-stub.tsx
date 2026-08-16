/**
 * ⚠️ STUB — PRODUCT_PLAN 1.4 / P3 calendar sync. Hardcoded, identical every day.
 *
 * Real calendar sync is explicitly out of scope, but a day timeline with no
 * fixed commitments on it doesn't show the thing that makes timeboxing matter:
 * quest work has to fit *around* the meetings. These two events stand in for a
 * synced calendar so that story is visible. Nothing reads or writes them, and
 * they are never counted in any total — Insights aggregates `time_entries`
 * only, so no number in the app is affected by what is listed here.
 */

export type CalendarEvent = {
  title: string;
  /** Minutes from local midnight. */
  startMinute: number;
  endMinute: number;
};

export const STUB_CALENDAR_EVENTS: readonly CalendarEvent[] = [
  { title: "Team sync", startMinute: 10 * 60, endMinute: 10 * 60 + 30 },
  { title: "1:1 with Niklas", startMinute: 15 * 60, endMinute: 16 * 60 },
] as const;
