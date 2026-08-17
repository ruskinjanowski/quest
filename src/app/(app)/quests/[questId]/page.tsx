import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { QuestDot } from "@/components/quest-dot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { targetProgress } from "@/features/insights/domain";
import { MilestonesStub } from "@/features/quests/components/milestones-stub";
import { QuestDialog } from "@/features/quests/components/quest-dialog";
import { QuestHealthBadge } from "@/features/quests/components/quest-health-badge";
import { QuestMenu } from "@/features/quests/components/quest-menu";
import { SocialDiscoveryStub } from "@/features/quests/components/social-discovery-stub";
import { QUEST_LIFECYCLE_LABELS } from "@/features/quests/labels";
import { getQuest, getQuestHistory } from "@/features/quests/queries";
import type { ScheduleOption } from "@/features/tasks/components/schedule-menu";
import { TaskList } from "@/features/tasks/components/task-list";
import { listTasksForQuest } from "@/features/tasks/queries";
import { WINDOW_DAYS } from "@/features/home/queries";
import { formatHours } from "@/lib/duration";
import { requireUser } from "@/lib/session";
import {
  dayHeading,
  dayKeysFrom,
  rollingDayKeys,
  todayKey,
  trailingWeekKeys,
} from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";

export const metadata: Metadata = { title: "Quest · Quest" };

const HISTORY_WEEKS = 4;
const SCHEDULABLE_DAYS = 5;

/** How much finished work to list before it stops being useful history. */
const RECENT_DONE = 8;

export default async function QuestDetailPage({
  params,
}: PageProps<"/quests/[questId]">) {
  const { questId } = await params;
  const user = await requireUser();
  const timeZone = await getTimeZone();

  const quest = await getQuest(user.id, questId);
  if (!quest) notFound();

  const weeks = trailingWeekKeys(HISTORY_WEEKS, timeZone);
  const [tasks, history, recent] = await Promise.all([
    listTasksForQuest(user.id, quest.id),
    getQuestHistory(user.id, quest.id, weeks),
    // The headline uses the same rolling window as Home and the quest list, so
    // the same quest doesn't report two different numbers on two screens.
    getQuestHistory(user.id, quest.id, [
      { label: "recent", ...rollingDayKeys(WINDOW_DAYS, timeZone) },
    ]),
  ]);

  const today = todayKey(timeZone);
  const lately = recent[0]?.minutes ?? 0;
  const peak = Math.max(1, ...history.map((week) => week.minutes));
  const progress = targetProgress(lately, quest.targetHoursWeek);
  const questOption = { id: quest.id, name: quest.name, color: quest.color };

  const scheduleOptions: ScheduleOption[] = dayKeysFrom(
    today,
    SCHEDULABLE_DAYS,
    timeZone,
  ).map((dateKey) => ({ dateKey, label: dayHeading(dateKey, today, timeZone) }));

  const open = tasks.filter((task) => !task.done);
  const allDone = tasks.filter((task) => task.done);
  const done = allDone.slice(0, RECENT_DONE);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <QuestDot color={quest.color} className="size-3" />
            {quest.name}
          </span>
        }
        description={
          quest.description ??
          (quest.lifecycle === "active"
            ? undefined
            : QUEST_LIFECYCLE_LABELS[quest.lifecycle])
        }
        actions={
          <>
            <QuestHealthBadge health={quest.health} />
            <QuestDialog
              quest={{
                id: quest.id,
                name: quest.name,
                description: quest.description,
                color: quest.color,
                targetHoursWeek: quest.targetHoursWeek,
              }}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="size-4" /> Edit
                </Button>
              }
            />
            <QuestMenu quest={quest} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Last 7 days</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-semibold tabular-nums">
                {formatHours(lately)}
              </p>

              {progress !== null && quest.targetHoursWeek !== null && (
                <div className="space-y-1.5">
                  <Progress value={progress * 100} className="h-2" />
                  <p className="text-muted-foreground text-xs">
                    of a {quest.targetHoursWeek}h weekly target
                  </p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground mb-2 text-xs">
                  Last {HISTORY_WEEKS} weeks
                </p>
                <div className="flex items-end gap-2">
                  {history.map((week) => (
                    <div
                      key={week.label}
                      className="flex flex-1 flex-col items-center gap-1.5"
                    >
                      <div className="flex h-20 w-full items-end">
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: `${Math.max(2, (week.minutes / peak) * 100)}%`,
                            backgroundColor: "var(--quest)",
                            opacity: week.minutes === 0 ? 0.15 : 0.85,
                          }}
                        />
                      </div>
                      <span className="text-muted-foreground text-[10px]">
                        {week.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-sm font-medium">Tasks</h2>

            {tasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description="A quest moves forward through tasks. Add one from the board or the backlog."
              />
            ) : (
              <div className="space-y-6">
                <TaskList
                  tasks={open}
                  quests={[questOption]}
                  scheduleOptions={scheduleOptions}
                />

                {done.length > 0 && (
                  <div>
                    <h3 className="text-muted-foreground mb-1 px-2 text-xs font-medium tracking-wide uppercase">
                      Recently done
                      {allDone.length > done.length &&
                        ` · ${done.length} of ${allDone.length}`}
                    </h3>
                    <TaskList
                      tasks={done}
                      quests={[questOption]}
                      scheduleOptions={scheduleOptions}
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <SocialDiscoveryStub questName={quest.name} />
          <MilestonesStub />
        </div>
      </div>
    </div>
  );
}
