"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  adjustEntry,
  deleteEntry,
  getTaskEntries,
  type TaskEntrySummary,
} from "../actions";

/**
 * Edit or delete the individual blocks of tracked time on a task
 * (PRODUCT_PLAN §5: "tracked time is editable after the fact"). This wires up
 * the `adjustEntry` / `deleteEntry` actions, which existed from the start but
 * had no way to be reached — fixing a mistimed or forgotten timer was
 * impossible from the UI until now.
 */
export function EditTimeDialog({
  taskId,
  taskTitle,
  open,
  onOpenChange,
}: {
  taskId: string;
  taskTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [entries, setEntries] = useState<TaskEntrySummary[] | null>(null);
  const [loading, startLoad] = useTransition();

  // Fetch on open. State is only ever set inside the async transition callback,
  // never synchronously in the effect body (the React Compiler rule, CLAUDE.md).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    startLoad(async () => {
      const result = await getTaskEntries(taskId);
      if (cancelled) return;
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEntries(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [open, taskId]);

  function refresh() {
    startLoad(async () => {
      const result = await getTaskEntries(taskId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEntries(result.data);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit tracked time</DialogTitle>
          <DialogDescription className="truncate">{taskTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {entries === null ? (
            <p className="text-muted-foreground py-4 text-center text-sm">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No time tracked on this task yet.
            </p>
          ) : (
            entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                busy={loading}
                onChanged={refresh}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EntryRow({
  entry,
  busy,
  onChanged,
}: {
  entry: TaskEntrySummary;
  busy: boolean;
  onChanged: () => void;
}) {
  const [minutes, setMinutes] = useState(entry.minutes);
  const [pending, startTransition] = useTransition();

  const startedAt = new Date(entry.startedAt);
  const when = startedAt.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const disabled = pending || busy;
  const dirty = minutes !== entry.minutes;

  function save() {
    startTransition(async () => {
      const result = await adjustEntry({ entryId: entry.id, minutes });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChanged();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteEntry(entry.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Entry deleted.");
      onChanged();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm tabular-nums">{when}</p>
        <p className="text-muted-foreground text-xs">
          {entry.running ? "Running" : entry.source === "manual" ? "Manual" : "Timer"}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={1440}
          value={minutes}
          disabled={disabled}
          onChange={(event) => setMinutes(Number(event.target.value))}
          className="h-8 w-20 tabular-nums"
          aria-label="Minutes"
        />
        <span className="text-muted-foreground text-xs">min</span>
      </div>

      <Button
        type="button"
        size="sm"
        variant={dirty ? "default" : "outline"}
        disabled={disabled || !dirty}
        onClick={save}
        className={cn(!dirty && "opacity-60")}
      >
        Save
      </Button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-destructive size-8"
        aria-label="Delete entry"
        disabled={disabled}
        onClick={remove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
