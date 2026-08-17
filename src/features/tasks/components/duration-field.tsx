"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/duration";

/**
 * A click-to-edit `h:mm` number — the `PLANNED` and `ACTUAL` fields on the task
 * panel.
 *
 * Typed rather than picked from a list, because the two numbers it edits are
 * the ones the whole product measures: rounding someone's 1h50 to the nearest
 * preset would quietly falsify the split. `2`, `2:15`, `90m` and `1.5h` all
 * parse, so nobody has to learn a format.
 */
export function DurationField({
  value,
  onChange,
  label,
  disabled,
  emphasis = false,
}: {
  value: number | null;
  onChange: (minutes: number | null) => void;
  label: string;
  disabled?: boolean;
  /** Draw it as the live number rather than the reference one. */
  emphasis?: boolean;
}) {
  // `null` means "not being edited", so the field falls back to the server's
  // number the moment you leave it. Holding a synced copy in state instead
  // would need an effect to keep the two in step — which the React Compiler
  // lint rules reject, and which would go stale when ticking the checkbox
  // banks the estimate from outside.
  const [draft, setDraft] = useState<string | null>(null);
  // Escape blurs the field, and blur is what commits — so the cancel has to
  // outrun it through a ref rather than through state.
  const cancelled = useRef(false);

  function commit(text: string) {
    setDraft(null);
    const parsed = parseDuration(text);
    if (parsed !== value) onChange(parsed);
  }

  return (
    <label className="flex flex-col items-end gap-0.5">
      <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
        {label}
      </span>
      <input
        value={draft ?? (value === null ? "--:--" : formatClock(value))}
        disabled={disabled}
        inputMode="numeric"
        aria-label={label}
        onFocus={(event) => {
          setDraft(value === null ? "" : formatClock(value));
          event.target.select();
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => {
          if (cancelled.current) {
            cancelled.current = false;
            return;
          }
          commit(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            cancelled.current = true;
            setDraft(null);
            event.currentTarget.blur();
          }
        }}
        className={cn(
          "focus-visible:ring-ring w-16 rounded-md bg-transparent px-1 py-0.5 text-right text-base tabular-nums focus-visible:ring-2 focus-visible:outline-none",
          emphasis ? "font-medium" : "text-muted-foreground",
          value === null && draft === null && "text-muted-foreground/60",
          !disabled && "hover:bg-muted cursor-text",
        )}
      />
    </label>
  );
}

/**
 * "2" → 120 · "2:15" → 135 · "90m" → 90 · "1.5h" → 90 · "" → null.
 *
 * A bare number means hours, matching the `h:mm` the field displays — typing
 * "2" into a box reading "2:00" should not silently mean two minutes.
 */
export function parseDuration(input: string): number | null {
  const text = input.trim().toLowerCase();
  if (text.length === 0) return null;

  const clock = text.match(/^(\d+):([0-5]?\d)$/);
  if (clock) return clamp(Number(clock[1]) * 60 + Number(clock[2]));

  const suffixed = text.match(/^(\d+(?:[.,]\d+)?)\s*(h|hr|hrs|m|min|mins)$/);
  if (suffixed) {
    const amount = Number(suffixed[1].replace(",", "."));
    return clamp(suffixed[2].startsWith("h") ? amount * 60 : amount);
  }

  const bare = Number(text.replace(",", "."));
  if (Number.isNaN(bare)) return null;

  return clamp(bare * 60);
}

function clamp(minutes: number): number | null {
  const rounded = Math.round(minutes);
  if (rounded <= 0) return null;
  return Math.min(24 * 60, rounded);
}
