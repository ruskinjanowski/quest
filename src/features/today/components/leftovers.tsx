"use client";

import { ChevronDown, CornerUpRight } from "lucide-react";
import { useState } from "react";
import { QuestDot } from "@/components/quest-dot";
import { Button } from "@/components/ui/button";
import { updateTask } from "@/features/tasks/actions";
import type { TaskRow } from "@/features/tasks/queries";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";

/**
 * Unfinished work from days already gone.
 *
 * A planner that silently rolls yesterday forward is lying about what you did;
 * one that drops it is lying about what you owe. So it sits here, collapsed,
 * with one button to pull it onto today — and the option of leaving it exactly
 * where it is.
 */
export function Leftovers({
  tasks,
  dateKey,
}: {
  tasks: readonly TaskRow[];
  /** The day "pull it forward" means. */
  dateKey: string;
}) {
  const [open, setOpen] = useState(false);
  const update = useAction(updateTask);

  if (tasks.length === 0) return null;

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
      >
        <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
        {tasks.length} left over from earlier
      </button>

      {open && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="bg-muted/50 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
            >
              <QuestDot color={task.questColor} />
              <span className="max-w-52 truncate">{task.title}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label={`Pull "${task.title}" onto this day`}
                disabled={update.pending}
                onClick={() => update.run({ id: task.id, plannedDate: dateKey })}
              >
                <CornerUpRight className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
