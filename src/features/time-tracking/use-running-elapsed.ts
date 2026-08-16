"use client";

import { useEffect, useState } from "react";

/**
 * Minutes elapsed since the server stamped `asOf`, ticking once a second while
 * `running`. Returns 0 when nothing is running, so callers can add it to a
 * server figure unconditionally.
 *
 * Every live number in the app counts from that one server timestamp rather
 * than from its own mount. The server already counted the running entry up to
 * `asOf`, so a component measuring from a later moment would silently drop the
 * gap — and two components mounting at different times would disagree with each
 * other. One origin, many tickers.
 *
 * The interval is the only thing in here that touches state, which keeps this
 * on the right side of the React Compiler's rule against synchronous `setState`
 * in an effect (see CLAUDE.md).
 */
export function useRunningElapsedMinutes(asOf: string, running: boolean): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!running) return;

    const renderedAt = new Date(asOf).getTime();
    const interval = setInterval(
      () => setElapsedMs(Math.max(0, Date.now() - renderedAt)),
      1_000,
    );

    return () => clearInterval(interval);
  }, [running, asOf]);

  return running ? elapsedMs / 60_000 : 0;
}
