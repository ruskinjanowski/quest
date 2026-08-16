"use client";

import { Archive, CheckCircle2, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import type { Quest } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction } from "@/hooks/use-action";
import { deleteQuest, setQuestLifecycle, updateQuest } from "../actions";
import { QUEST_HEALTH_LABELS, QUEST_HEALTH_ORDER } from "../labels";

const NO_HEALTH = "__none__";

/**
 * Lifecycle and health in one menu, but visibly separate: lifecycle decides
 * whether a quest still counts in Insights, health is just how it's going
 * (PRODUCT_PLAN 0.1 / 1.3b).
 */
export function QuestMenu({ quest }: { quest: Quest }) {
  const lifecycle = useAction(setQuestLifecycle);
  const update = useAction(updateQuest);
  const remove = useAction(deleteQuest, {
    successMessage: "Quest deleted. Its tasks moved to Admin.",
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" aria-label="Quest actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Status
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={quest.health ?? NO_HEALTH}
          onValueChange={(value) =>
            update.run({
              id: quest.id,
              health: value === NO_HEALTH ? null : (value as Quest["health"]),
            })
          }
        >
          {QUEST_HEALTH_ORDER.map((health) => (
            <DropdownMenuRadioItem key={health} value={health}>
              {QUEST_HEALTH_LABELS[health]}
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuRadioItem value={NO_HEALTH}>No status</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {quest.lifecycle === "active" ? (
          <>
            <DropdownMenuItem
              disabled={lifecycle.pending}
              onSelect={() => lifecycle.run({ id: quest.id, lifecycle: "completed" })}
            >
              <CheckCircle2 className="size-4" /> Mark completed
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={lifecycle.pending}
              onSelect={() => lifecycle.run({ id: quest.id, lifecycle: "archived" })}
            >
              <Archive className="size-4" /> Archive
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            disabled={lifecycle.pending}
            onSelect={() => lifecycle.run({ id: quest.id, lifecycle: "active" })}
          >
            <RotateCcw className="size-4" /> Reactivate
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={remove.pending}
          onSelect={() => remove.run(quest.id)}
        >
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
