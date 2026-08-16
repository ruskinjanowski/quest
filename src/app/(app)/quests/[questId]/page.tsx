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
import { getQuest, getQuestHistory } from "@/features/quests/queries";
import { AddTaskForm } from "@/features/tasks/components/add-task-form";
import { TaskList } from "@/features/tasks/components/task-list";
import { listTasksForQuest } from "@/features/tasks/queries";
import { formatHours } from "@/lib/duration";
import { requireUser } from "@/lib/session";
import { shiftDateKey, todayKey, trailingWeeks } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";
import { QUEST_LIFECYCLE_LABELS } from "@/features/quests/labels";

export const metadata: Metadata = { title: "Quest · Quest" };

const HISTORY_WEEKS = 4;

export default async function QuestDetailPage({
  params,
}: PageProps<"/quests/[questId]">) {
  const { questId } = await params;
  const user = await requireUser();
  const timeZone = await getTimeZone();

  const quest = await getQuest(user.id, questId);
  if (!quest) notFound();

  const weeks = trailingWeeks(HISTORY_WEEKS, timeZone);
  const [tasks, history] = await Promise.all([
    listTasksForQuest(user.id, quest.id),
    getQuestHistory(user.id, quest.id, weeks),
  ]);

  const dateKey = todayKey(timeZone);
  const thisWeek = history.at(-1)?.minutes ?? 0;
  const peak = Math.max(1, ...history.map((week) => week.minutes));
  const progress = targetProgress(thisWeek, quest.targetHoursWeek);
  const questOption = { id: quest.id, name: quest.name, color: quest.color };

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
          quest.lifecycle === "active"
            ? undefined
            : QUEST_LIFECYCLE_LABELS[quest.lifecycle]
        }
        actions={
          <>
            <QuestHealthBadge health={quest.health} />
            <QuestDialog
              quest={{
                id: quest.id,
                name: quest.name,
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
              <CardTitle className="text-sm font-medium">This week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-semibold tabular-nums">
                {formatHours(thisWeek)}
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
                    <div key={week.label} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="flex h-20 w-full items-end">
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: `${Math.max(2, (week.minutes / peak) * 100)}%`,
                            backgroundColor: "var(--primary)",
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
            <AddTaskForm
              quests={[questOption]}
              plannedDate={dateKey}
              placeholder="Add a task to this quest…"
            />
            {tasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description="A quest moves forward through tasks. Add the next one."
              />
            ) : (
              <TaskList
                tasks={tasks}
                quests={[questOption]}
                dateKey={dateKey}
                nextDateKey={shiftDateKey(dateKey, 1, timeZone)}
                grouped={false}
              />
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
