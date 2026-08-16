"use client";

import { useEffect } from "react";
import { TIME_ZONE_COOKIE } from "@/lib/timezone";

/**
 * Tells the server which time zone the browser is in, so "today" and "this
 * week" line up with the user's actual day (PRODUCT_PLAN §5: timezone =
 * browser local). Renders nothing.
 */
export function TimeZoneSync() {
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;

    const current = document.cookie
      .split("; ")
      .find((part) => part.startsWith(`${TIME_ZONE_COOKIE}=`))
      ?.split("=")[1];

    if (current === encodeURIComponent(timeZone)) return;

    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=31536000; samesite=lax`;
    // The first paint of a new session used the fallback zone; refresh once.
    window.location.reload();
  }, []);

  return null;
}
