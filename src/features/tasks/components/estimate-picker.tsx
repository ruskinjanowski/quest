"use client";

import { Hourglass } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDuration } from "@/lib/duration";
import { cn } from "@/lib/utils";

/** The sentinel for "no estimate" — Select can't hold a null value. */
export const NO_ESTIMATE_VALUE = "__none__";

/**
 * How long you think it will take. Sunsama's whole planning ritual is built on
 * this number — without it there is no projected split and no workload to warn
 * about — so it sits inline next to the quest picker rather than behind a
 * detail screen, and offers a short list of presets instead of a free-text box.
 */
export const ESTIMATE_PRESETS = [15, 30, 45, 60, 90, 120, 180, 240] as const;

export function EstimatePicker({
  value,
  onChange,
  disabled,
  className,
}: {
  value: number | null;
  onChange: (minutes: number | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  // A hand-set estimate that isn't one of the presets still has to be listed,
  // or selecting it would silently round the user's number.
  const options =
    value !== null && !ESTIMATE_PRESETS.includes(value as (typeof ESTIMATE_PRESETS)[number])
      ? [...ESTIMATE_PRESETS, value].sort((a, b) => a - b)
      : [...ESTIMATE_PRESETS];

  return (
    <Select
      value={value === null ? NO_ESTIMATE_VALUE : String(value)}
      disabled={disabled}
      onValueChange={(next) =>
        onChange(next === NO_ESTIMATE_VALUE ? null : Number(next))
      }
    >
      <SelectTrigger
        size="sm"
        className={cn("h-7 w-auto gap-1.5 border-dashed text-xs", className)}
        aria-label="Estimate"
      >
        <SelectValue>
          <span
            className={cn(
              "flex items-center gap-1.5 tabular-nums",
              value === null && "text-muted-foreground",
            )}
          >
            <Hourglass className="size-3" />
            {value === null ? "Est." : formatDuration(value)}
          </span>
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {options.map((minutes) => (
          <SelectItem key={minutes} value={String(minutes)}>
            {formatDuration(minutes)}
          </SelectItem>
        ))}
        <SelectItem value={NO_ESTIMATE_VALUE}>No estimate</SelectItem>
      </SelectContent>
    </Select>
  );
}
