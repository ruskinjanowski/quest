import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestOption } from "@/features/quests/components/quest-picker";
import { AddTaskForm } from "@/features/tasks/components/add-task-form";
import { TaskList } from "@/features/tasks/components/task-list";
import type { TaskRow } from "@/features/tasks/queries";

/**
 * Everything that *could* be on the day but isn't yet: what you didn't finish
 * earlier, and what you captured for later.
 *
 * These two lists already existed — inside the "Plan my day" modal, and, for
 * the backlog, stranded at the bottom of the page where the only way to act on
 * a row was a hover menu item. Given a permanent home beside the day, with an
 * always-visible "add to this day" button on every row, the morning ritual
 * stops being the single door into the plan and becomes the fast path through
 * it.
 */
export function DayRail({
  unfinished,
  backlog,
  quests,
  dateKey,
  nextDateKey,
}: {
  unfinished: readonly TaskRow[];
  backlog: readonly TaskRow[];
  quests: readonly QuestOption[];
  dateKey: string;
  nextDateKey: string;
}) {
  return (
    <div className="space-y-4">
      {unfinished.length > 0 && (
        <RailCard
          title="Unfinished"
          hint="Left over from earlier days. Pull it forward or let it go — but decide."
        >
          <TaskList
            tasks={unfinished}
            quests={quests}
            dateKey={dateKey}
            nextDateKey={nextDateKey}
            showPlanAction
            dense
          />
        </RailCard>
      )}

      <RailCard title="Inbox" hint={backlog.length === 0 ? "Nothing waiting." : undefined}>
        {backlog.length > 0 && (
          <TaskList
            tasks={backlog}
            quests={quests}
            dateKey={dateKey}
            nextDateKey={nextDateKey}
            showPlanAction
            dense
          />
        )}

        <AddTaskForm
          quests={quests}
          plannedDate={null}
          placeholder="Capture for later…"
          variant="inline"
        />
      </RailCard>
    </div>
  );
}

function RailCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 py-4">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="text-xs font-medium tracking-wide uppercase">
          {title}
        </CardTitle>
        {hint && <p className="text-muted-foreground pt-1 text-xs">{hint}</p>}
      </CardHeader>
      <CardContent className="px-2">{children}</CardContent>
    </Card>
  );
}
