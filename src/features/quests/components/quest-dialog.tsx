"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { QUEST_COLORS, type QuestColorKey } from "@/lib/quest-colors";
import { cn } from "@/lib/utils";
import { createQuest, updateQuest } from "../actions";

type QuestDraft = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  targetHoursWeek: number | null;
};

/**
 * Create and edit share a dialog: the fields are the same, and a quest is
 * deliberately a tiny object (PRODUCT_PLAN 0.1) — name, colour, optional
 * weekly target. Lifecycle and health are set from the quest's own menu, since
 * they are decisions about a quest rather than properties you type in.
 */
export function QuestDialog({
  quest,
  trigger,
}: {
  quest?: QuestDraft;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(quest?.name ?? "");
  const [description, setDescription] = useState(quest?.description ?? "");
  const [color, setColor] = useState<QuestColorKey | undefined>(
    quest?.color as QuestColorKey | undefined,
  );
  const [target, setTarget] = useState(quest?.targetHoursWeek?.toString() ?? "");

  const isEdit = Boolean(quest);
  const close = () => {
    setOpen(false);
    if (!isEdit) {
      setName("");
      setDescription("");
      setColor(undefined);
      setTarget("");
    }
  };

  const create = useAction(createQuest, { onSuccess: close });
  const update = useAction(updateQuest, { onSuccess: close });
  const pending = create.pending || update.pending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const targetHoursWeek = target.trim() === "" ? null : Number(target);

    if (quest) {
      update.run({ id: quest.id, name: trimmed, description, color, targetHoursWeek });
    } else {
      create.run({ name: trimmed, description, color, targetHoursWeek });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" /> New quest
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit quest" : "New quest"}</DialogTitle>
            <DialogDescription>
              A quest is something you want to advance — not a task list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quest-name">Name</Label>
              <Input
                id="quest-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Learn Spanish"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quest-description">Why it matters (optional)</Label>
              <Textarea
                id="quest-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="So I can hold a conversation on the trip in March."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Colour</Label>
              <div className="flex flex-wrap gap-2">
                {QUEST_COLORS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={color === option.key}
                    onClick={() => setColor(option.key)}
                    className={cn(
                      "size-7 rounded-full transition-transform",
                      color === option.key
                        ? "ring-foreground scale-110 ring-2 ring-offset-2 ring-offset-[var(--background)]"
                        : "hover:scale-105",
                    )}
                    style={{ backgroundColor: option.hex }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quest-target">Target hours per week (optional)</Label>
              <Input
                id="quest-target"
                type="number"
                min={1}
                max={168}
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                placeholder="5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim()}>
              {isEdit ? "Save" : "Create quest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
