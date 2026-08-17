"use client";

import { CalendarDays, Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type DateKey, formatDateKey } from "@/lib/time";

export type ScheduleOption = { dateKey: DateKey; label: string };

/**
 * "When are you doing this?" as a menu.
 *
 * Dragging a card onto a day is the gesture the planner is known for, but drag
 * is mouse-only and fails on a phone — so every scheduling move is also one
 * click from here. It doubles as the demo's safety net: a drop that misses on
 * camera is never a dead end.
 */
export function ScheduleMenu({
  value,
  options,
  onSelect,
  disabled,
  trigger,
  align = "end",
}: {
  /** The task's current day, or null for the backlog. */
  value: DateKey | null;
  options: readonly ScheduleOption[];
  onSelect: (dateKey: DateKey | null) => void;
  disabled?: boolean;
  trigger?: React.ReactNode;
  align?: "start" | "end";
}) {
  const current = options.find((option) => option.dateKey === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 border-dashed px-2 text-xs font-normal"
          >
            <CalendarDays className="size-3.5" />
            {/* A day outside the offered range — a finished task from last
                week — still deserves a name rather than a raw key. */}
            {current?.label ?? (value === null ? "Plan" : formatDateKey(value))}
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-44">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.dateKey}
            onSelect={() => onSelect(option.dateKey)}
            className={cn(option.dateKey === value && "font-medium")}
          >
            <CalendarDays className="size-4" />
            <span className="flex-1">{option.label}</span>
            {option.dateKey === value && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onSelect(null)}>
          <Inbox className="size-4" />
          <span className="flex-1">Backlog</span>
          {value === null && <Check className="size-3.5" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
