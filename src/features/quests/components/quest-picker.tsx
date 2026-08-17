"use client";

import { QuestDot } from "@/components/quest-dot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type QuestOption = { id: string; name: string; color: string };

/** The sentinel for "no quest" — Select can't hold a null value. */
export const ADMIN_VALUE = "__admin__";

/**
 * Assigning a task to a quest is the product's core interaction
 * (PRODUCT_PLAN 0.2), so it lives inline on the task row rather than behind an
 * edit screen. Admin is always the last option and never a quest.
 */
export function QuestPicker({
  value,
  quests,
  onChange,
  disabled,
  compact = false,
  className,
}: {
  value: string | null;
  quests: readonly QuestOption[];
  onChange: (questId: string | null) => void;
  disabled?: boolean;
  /**
   * Drop the name and keep the dot. For rows sitting under a quest-coloured
   * header, where spelling the quest out again on every line is noise — but
   * hiding the control altogether would put the app's core interaction behind
   * a hover.
   */
  compact?: boolean;
  className?: string;
}) {
  const selected = quests.find((quest) => quest.id === value) ?? null;
  const name = selected?.name ?? "Admin";

  return (
    <Select
      value={value ?? ADMIN_VALUE}
      disabled={disabled}
      onValueChange={(next) => onChange(next === ADMIN_VALUE ? null : next)}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "h-7 w-auto gap-1.5 border-dashed text-xs",
          compact && "px-1.5",
          className,
        )}
        aria-label={`Quest: ${name}`}
      >
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <QuestDot color={selected?.color ?? null} />
            {!compact && <span className="max-w-32 truncate">{name}</span>}
          </span>
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {quests.map((quest) => (
          <SelectItem key={quest.id} value={quest.id}>
            <span className="flex items-center gap-2">
              <QuestDot color={quest.color} />
              {quest.name}
            </span>
          </SelectItem>
        ))}
        <SelectItem value={ADMIN_VALUE}>
          <span className="flex items-center gap-2">
            <QuestDot color={null} />
            Admin
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
