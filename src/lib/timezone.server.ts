import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_TIME_ZONE, TIME_ZONE_COOKIE, isValidTimeZone } from "./timezone";

/**
 * The user's time zone as the server sees it. Falls back to the default for a
 * brand-new visitor whose cookie hasn't been written yet; `<TimeZoneSync />`
 * corrects that on first paint.
 */
export async function getTimeZone(): Promise<string> {
  const value = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  if (!value) return DEFAULT_TIME_ZONE;

  const decoded = decodeURIComponent(value);
  return isValidTimeZone(decoded) ? decoded : DEFAULT_TIME_ZONE;
}
