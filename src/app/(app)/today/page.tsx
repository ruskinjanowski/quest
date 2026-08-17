import type { Metadata } from "next";
import { WINDOW_DAYS } from "@/features/home/queries";
import { listQuestsWithStats } from "@/features/quests/queries";
import { listTasksForDays, listUnfinishedBefore } from "@/features/tasks/queries";
import type { ScheduleOption } from "@/features/tasks/components/schedule-menu";
import { BoardNav } from "@/features/today/components/board-nav";
import { DayBoard, type BoardDay } from "@/features/today/components/day-board";
import { DayRail } from "@/features/today/components/day-rail";
import { Leftovers } from "@/features/today/components/leftovers";
import { ProjectedTimeline } from "@/features/today/components/projected-timeline";
import { WeekQuestsPanel } from "@/features/today/components/week-quests-panel";
import { requireUser } from "@/lib/session";
import {
  dayHeading,
  dayKeysFrom,
  formatDayAndMonth,
  formatWeekday,
  isDateKey,
  shiftDateKey,
  rollingDayKeys,
  todayKey,
} from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";

export const metadata: Metadata = { title: "Today · Quest" };

/** How many days the board shows at once. Three fits a laptop without scrolling. */
const VISIBLE_DAYS = 3;

/**
 * The planner (REDESIGN §3).
 *
 * Days as columns, tasks as cards, estimates adding up in each column header —
 * the mechanics anyone who has used Sunsama already knows. What Quest adds is
 * one line under the first column: how much of the day advances a quest, and
 * how much is admin.
 *
 * The viewed day comes from `?date=` so the page stays a server component and
 * any day is linkable.
 */
export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const params = await searchParams;
  const requested = Array.isArray(params.date) ? params.date[0] : params.date;

  const user = await requireUser();
  const timeZone = await getTimeZone();

  const today = todayKey(timeZone);
  const dateKey = isDateKey(requested) ? requested : today;
  const dateKeys = dayKeysFrom(dateKey, VISIBLE_DAYS, timeZone);

  const [tasks, unfinished, quests] = await Promise.all([
    listTasksForDays(user.id, dateKeys),
    listUnfinishedBefore(user.id, dateKey),
    listQuestsWithStats(user.id, rollingDayKeys(WINDOW_DAYS, timeZone), {
      lifecycle: ["active"],
    }),
  ]);

  const questOptions = quests.map((quest) => ({
    id: quest.id,
    name: quest.name,
    color: quest.color,
  }));

  const days: BoardDay[] = dateKeys.map((key) => ({
    dateKey: key,
    weekday: formatWeekday(key, timeZone),
    dayLabel: formatDayAndMonth(key, timeZone),
    isToday: key === today,
  }));

  // The schedule menu offers the visible days by their friendly names, so
  // "Today" and "Tomorrow" read as themselves rather than as dates.
  const scheduleOptions: ScheduleOption[] = dateKeys.map((key) => ({
    dateKey: key,
    label: dayHeading(key, today, timeZone),
  }));

  const firstDayTasks = tasks.filter((task) => task.plannedDate === dateKeys[0]);

  const scheduledByQuest = new Map<string, number>();
  for (const task of tasks) {
    if (!task.questId || task.done) continue;
    scheduledByQuest.set(
      task.questId,
      (scheduledByQuest.get(task.questId) ?? 0) + (task.estimateMinutes ?? 0),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <BoardNav
          previousKey={shiftDateKey(dateKey, -1, timeZone)}
          nextKey={shiftDateKey(dateKey, 1, timeZone)}
          isToday={dateKey === today}
        />
      </div>

      <Leftovers tasks={unfinished} dateKey={dateKey} />

      <div className="flex min-w-0 flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <DayBoard
            tasks={tasks}
            days={days}
            quests={questOptions}
            scheduleOptions={scheduleOptions}
          />
        </div>

        <DayRail
          dayLabel={dayHeading(dateKeys[0], today, timeZone)}
          timeline={<ProjectedTimeline tasks={firstDayTasks} />}
          quests={
            <WeekQuestsPanel quests={quests} scheduledByQuest={scheduledByQuest} />
          }
        />
      </div>
    </div>
  );
}
