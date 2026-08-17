import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/page-header";
import {
  BacklogBoard,
  BacklogCapture,
} from "@/features/backlog/components/backlog-board";
import { listActiveQuests } from "@/features/quests/queries";
import type { ScheduleOption } from "@/features/tasks/components/schedule-menu";
import { listBacklogTasks } from "@/features/tasks/queries";
import { requireUser } from "@/lib/session";
import { dayHeading, dayKeysFrom, todayKey } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";

export const metadata: Metadata = { title: "Backlog · Quest" };

/** How far ahead the row-level day picker offers to schedule. */
const SCHEDULABLE_DAYS = 5;

/**
 * Capture and triage (REDESIGN §6).
 *
 * A task with no `plannedDate` is a backlog task — the same nullable column
 * that makes "put this on Tuesday" a single write. What it gains here is a
 * horizon: how honest you're being about when it happens.
 */
export default async function BacklogPage() {
  const user = await requireUser();
  const timeZone = await getTimeZone();

  const today = todayKey(timeZone);
  const [tasks, quests] = await Promise.all([
    listBacklogTasks(user.id),
    listActiveQuests(user.id),
  ]);

  const questOptions = quests.map((quest) => ({
    id: quest.id,
    name: quest.name,
    color: quest.color,
  }));

  const scheduleOptions: ScheduleOption[] = dayKeysFrom(
    today,
    SCHEDULABLE_DAYS,
    timeZone,
  ).map((dateKey) => ({ dateKey, label: dayHeading(dateKey, today, timeZone) }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Backlog"
        description="Everything captured but not yet on a day. Drag it into a horizon you believe, or put it on a day."
      />

      <div className="space-y-5">
        <BacklogCapture quests={questOptions} />

        {tasks.length === 0 ? (
          <EmptyState
            title="Nothing waiting"
            description="A clear backlog is a good sign — capture stray ideas here so they're off your mind but not lost."
          />
        ) : (
          <BacklogBoard
            tasks={tasks}
            quests={questOptions}
            scheduleOptions={scheduleOptions}
          />
        )}
      </div>
    </div>
  );
}
