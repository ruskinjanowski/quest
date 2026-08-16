"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { updateTask } from "../actions";

/**
 * The optional longer description on a task — Clockify's "what exactly is this
 * work?" The timer bar names the task in a line; this is where the detail goes.
 *
 * The body only mounts while open, so the textarea always opens from the saved
 * note rather than whatever was last typed and abandoned.
 */
export function TaskNotesDialog({
  taskId,
  taskTitle,
  notes,
  open,
  onOpenChange,
}: {
  taskId: string;
  taskTitle: string;
  notes: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <NotesForm
            taskId={taskId}
            taskTitle={taskTitle}
            notes={notes}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NotesForm({
  taskId,
  taskTitle,
  notes,
  onDone,
}: {
  taskId: string;
  taskTitle: string;
  notes: string | null;
  onDone: () => void;
}) {
  const [value, setValue] = useState(notes ?? "");
  const { run, pending } = useAction(updateTask, {
    successMessage: "Notes saved.",
    onSuccess: onDone,
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Notes</DialogTitle>
        <DialogDescription className="truncate">{taskTitle}</DialogDescription>
      </DialogHeader>

      <Textarea
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Add detail — links, next steps, what “done” looks like…"
        className="min-h-32"
      />

      <DialogFooter>
        <Button
          type="button"
          disabled={pending}
          onClick={() => run({ id: taskId, notes: value })}
        >
          Save notes
        </Button>
      </DialogFooter>
    </>
  );
}
