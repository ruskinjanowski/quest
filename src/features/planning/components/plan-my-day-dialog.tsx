"use client";

import { Sunrise } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  QuestPicker,
  type QuestOption,
} from "@/features/quests/components/quest-picker";
import { EstimatePicker } from "@/features/tasks/components/estimate-picker";
import type { TaskRow } from "@/features/tasks/queries";
import { useAction } from "@/hooks/use-action";
import { formatDuration, formatPercent } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { DAY_CAPACITY_MINUTES, overloadMinutes, projectDay, workloadFor } from "../domain";
import { planDay } from "../actions";
import { SplitBar } from "./split-bar";

/**
 * The morning ritual (PRODUCT_PLAN 1.2) — the signature move of both source
 * products, and the thing that separates a planner from a to-do list.
 *
 * Three sources feed one decision: what's already on the day, what you didn't
 * finish earlier, and what's waiting in the backlog. Every row can be assigned
 * a quest and an estimate right here, and the footer recomputes the projected
 * quest/admin split as you go — so you commit to a shape of day rather than
 * discovering it afterwards on Insights.
 */

type Draft = {
  planned: boolean;
  questId: string | null;
  estimateMinutes: number | null;
};

type Section = { key: string; label: string; hint?: string; tasks: readonly TaskRow[] };

export function PlanMyDayDialog({
  dateKey,
  dayLabel,
  quests,
  todayTasks,
  unfinishedTasks,
  backlogTasks,
  capacityMinutes = DAY_CAPACITY_MINUTES,
}: {
  dateKey: string;
  dayLabel: string;
  quests: readonly QuestOption[];
  todayTasks: readonly TaskRow[];
  unfinishedTasks: readonly TaskRow[];
  backlogTasks: readonly TaskRow[];
  capacityMinutes?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Sunrise className="size-4" /> Plan my day
        </Button>
      </DialogTrigger>

      {/* Remounts on open so an abandoned plan never lingers as stale drafts. */}
      {open && (
        <PlanMyDayContent
          dateKey={dateKey}
          dayLabel={dayLabel}
          quests={quests}
          todayTasks={todayTasks}
          unfinishedTasks={unfinishedTasks}
          backlogTasks={backlogTasks}
          capacityMinutes={capacityMinutes}
          onDone={() => setOpen(false)}
        />
      )}
    </Dialog>
  );
}

function PlanMyDayContent({
  dateKey,
  dayLabel,
  quests,
  todayTasks,
  unfinishedTasks,
  backlogTasks,
  capacityMinutes,
  onDone,
}: {
  dateKey: string;
  dayLabel: string;
  quests: readonly QuestOption[];
  todayTasks: readonly TaskRow[];
  unfinishedTasks: readonly TaskRow[];
  backlogTasks: readonly TaskRow[];
  capacityMinutes: number;
  onDone: () => void;
}) {
  const sections: Section[] = [
    { key: "today", label: "On the day", tasks: todayTasks },
    {
      key: "unfinished",
      label: "Unfinished from earlier",
      hint: "Pull it forward or leave it behind — but decide.",
      tasks: unfinishedTasks,
    },
    {
      key: "backlog",
      label: "From your backlog",
      tasks: backlogTasks,
    },
  ].filter((section) => section.tasks.length > 0);

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      [...todayTasks, ...unfinishedTasks, ...backlogTasks].map((task) => [
        task.id,
        {
          // Only what's already on the day starts checked; everything else is
          // an explicit choice, which is the point of the ritual.
          planned: task.plannedDate === dateKey,
          questId: task.questId,
          estimateMinutes: task.estimateMinutes,
        },
      ]),
    ),
  );

  const { run, pending } = useAction(planDay, {
    successMessage: "Your day is planned.",
    onSuccess: onDone,
  });

  function patch(id: string, changes: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...changes } }));
  }

  /**
   * Unchecking a task only *unplans* it when it was on this day to begin with.
   * Declining to pull last Tuesday's leftover forward leaves it on last
   * Tuesday, where it honestly belongs.
   */
  function submit() {
    const wasOnThisDay = new Set(todayTasks.map((task) => task.id));

    run({
      dateKey,
      tasks: Object.entries(drafts).map(([id, draft]) => ({
        id,
        questId: draft.questId,
        estimateMinutes: draft.estimateMinutes,
        ...(draft.planned
          ? { plannedDate: dateKey }
          : wasOnThisDay.has(id)
            ? { plannedDate: null }
            : {}),
      })),
    });
  }

  const plannedDrafts = Object.values(drafts).filter((draft) => draft.planned);
  const projection = projectDay(plannedDrafts);
  const workload = workloadFor(projection.plannedMinutes, capacityMinutes);
  const over = overloadMinutes(projection.plannedMinutes, capacityMinutes);

  return (
    <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-2xl">
      <DialogHeader className="border-b px-6 py-4">
        <DialogTitle>Plan {dayLabel.toLowerCase()}</DialogTitle>
        <DialogDescription>Which quests will you advance today?</DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4">
        {sections.map((section) => (
          <section key={section.key}>
            <h3 className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              {section.label}
            </h3>
            {section.hint && (
              <p className="text-muted-foreground mb-2 text-xs">{section.hint}</p>
            )}

            <ul className="divide-border/60 divide-y">
              {section.tasks.map((task) => {
                const draft = drafts[task.id];

                return (
                  <li key={task.id} className="flex items-center gap-3 py-2">
                    <Checkbox
                      checked={draft.planned}
                      aria-label={`Plan "${task.title}"`}
                      onCheckedChange={(checked) =>
                        patch(task.id, { planned: checked === true })
                      }
                    />

                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        !draft.planned && "text-muted-foreground",
                      )}
                    >
                      {task.title}
                    </span>

                    <EstimatePicker
                      value={draft.estimateMinutes}
                      onChange={(estimateMinutes) => patch(task.id, { estimateMinutes })}
                    />
                    <QuestPicker
                      value={draft.questId}
                      quests={quests}
                      onChange={(questId) => patch(task.id, { questId })}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {sections.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Nothing to plan yet — capture a few tasks first.
          </p>
        )}
      </div>

      <div className="space-y-2 border-t px-6 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <span>
            <span className="font-medium tabular-nums">
              {formatDuration(projection.plannedMinutes)}
            </span>{" "}
            <span className="text-muted-foreground">
              across {plannedDrafts.length}{" "}
              {plannedDrafts.length === 1 ? "task" : "tasks"}
            </span>
          </span>

          <span className="text-muted-foreground tabular-nums">
            <span className="text-foreground font-medium">
              {formatPercent(projection.questShare)}
            </span>{" "}
            quest · {formatPercent(projection.adminShare)} admin
          </span>
        </div>

        <SplitBar projection={projection} />

        <p
          className={cn(
            "text-muted-foreground text-xs",
            over > 0 && "text-destructive",
          )}
        >
          {over > 0
            ? `${formatDuration(over)} over a ${formatDuration(capacityMinutes)} day. Drop something now rather than at 6pm.`
            : projection.unestimatedCount > 0
              ? `${projection.unestimatedCount} planned ${projection.unestimatedCount === 1 ? "task has" : "tasks have"} no estimate, so the projection is optimistic.`
              : WORKLOAD_NOTE[workload]}
        </p>
      </div>

      <DialogFooter className="border-t px-6 py-4">
        <Button variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button disabled={pending} onClick={submit}>
          Commit to the day
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const WORKLOAD_NOTE = {
  empty: "Pick the tasks that make today count.",
  light: "A light day — is there a quest task you could pull in?",
  balanced: "A realistic day.",
  full: "A full day. This is about as much as fits.",
  over: "",
} as const;
