import { getTodaySplit } from "@/features/insights/queries";
import { dayRange, todayKey } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";
import { requireUser } from "@/lib/session";
import { getRunningTimer } from "../queries";
import { LiveSplitCounter } from "./live-split-counter";

/**
 * Server half of the header counter: reads today's split once, then lets the
 * client component tick. Rendered in the app shell so the number is present on
 * every screen, not buried in a report.
 */
export async function TodayCounter() {
  const user = await requireUser();
  const timeZone = await getTimeZone();
  const range = dayRange(todayKey(timeZone), timeZone);

  const [summary, running] = await Promise.all([
    getTodaySplit(user.id, range),
    getRunningTimer(user.id),
  ]);

  return (
    <LiveSplitCounter
      questMinutes={summary.questMinutes}
      adminMinutes={summary.adminMinutes}
      runningSince={running ? new Date().toISOString() : null}
      runningIsQuest={Boolean(running?.questId)}
    />
  );
}
