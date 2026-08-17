/**
 * Every duration in the app is minutes (integer). Formatting lives here so the
 * header counter, the task rows and the Insights charts never drift apart.
 */

export function minutesToHours(minutes: number): number {
  return minutes / 60;
}

/** "3.5h" — the Insights/header voice. */
export function formatHours(minutes: number, fractionDigits = 1): string {
  return `${minutesToHours(minutes).toFixed(fractionDigits)}h`;
}

/** "0:45" — the timer voice, on task rows. */
export function formatClock(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  return `${hours}:${String(safe % 60).padStart(2, "0")}`;
}

/**
 * "0:45:12" — a *running* timer. `formatClock` resolves to whole minutes, so a
 * timer you had just started sat on the same number for up to a minute and read
 * as broken. Seconds are the proof that it's counting; they'd be noise on the
 * fifty stopped rows around it, which is why this is a separate voice.
 */
export function formatStopwatch(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes * 60));
  const seconds = total % 60;
  const wholeMinutes = Math.floor(total / 60);

  return `${Math.floor(wholeMinutes / 60)}:${String(wholeMinutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** "1h 45m" / "45m" — prose voice, for summaries and estimates. */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;

  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

/** Guards divide-by-zero in every split calculation. */
export function share(part: number, total: number): number {
  return total <= 0 ? 0 : part / total;
}
