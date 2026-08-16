/**
 * PRODUCT_PLAN §5 says "timezone = browser local". The server needs to know it
 * too — otherwise "today" on a Vercel box in UTC is the wrong day for anyone
 * working in the evening in Europe.
 *
 * `<TimeZoneSync />` writes the browser's zone into this cookie; the server
 * reads it via `getTimeZone()` in `timezone.server.ts`. This module stays free
 * of server imports so both sides can share the constants.
 */

export const TIME_ZONE_COOKIE = "quest_tz";
export const DEFAULT_TIME_ZONE = "UTC";

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
