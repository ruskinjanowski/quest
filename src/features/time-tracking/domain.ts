/**
 * Pure semantics of a time entry — no database, no React. Everything that
 * turns entries into numbers (task rows, the header counter, Insights) goes
 * through here, so "how long was that?" has exactly one answer.
 */

export type TimeEntryLike = {
  source: "timer" | "manual";
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
};

export const MS_PER_MINUTE = 60_000;

export function isRunning(entry: TimeEntryLike): boolean {
  return entry.source === "timer" && entry.endedAt === null;
}

/**
 * Minutes an entry accounts for. A running timer counts up to `now`, which is
 * what makes the header counter tick without storing anything.
 */
export function entryMinutes(entry: TimeEntryLike, now: Date = new Date()): number {
  if (entry.durationMinutes !== null) {
    return Math.max(0, entry.durationMinutes);
  }

  const end = entry.endedAt ?? now;
  return Math.max(0, (end.getTime() - entry.startedAt.getTime()) / MS_PER_MINUTE);
}

export function totalMinutes(
  entries: readonly TimeEntryLike[],
  now: Date = new Date(),
): number {
  return entries.reduce((sum, entry) => sum + entryMinutes(entry, now), 0);
}

/**
 * Minutes of an entry that fall inside a range. Entries are short enough that
 * clipping matters only for a timer left running across a boundary, but the
 * aggregations stay honest this way.
 */
export function entryMinutesInRange(
  entry: TimeEntryLike,
  range: { start: Date; end: Date },
  now: Date = new Date(),
): number {
  const start = entry.startedAt.getTime();

  // A manual entry has no meaningful window; it counts on its start day.
  if (entry.durationMinutes !== null) {
    return start >= range.start.getTime() && start < range.end.getTime()
      ? Math.max(0, entry.durationMinutes)
      : 0;
  }

  const end = (entry.endedAt ?? now).getTime();
  const overlap =
    Math.min(end, range.end.getTime()) - Math.max(start, range.start.getTime());

  return overlap > 0 ? overlap / MS_PER_MINUTE : 0;
}
