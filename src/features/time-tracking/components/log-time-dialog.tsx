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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "@/hooks/use-action";
import { logTime } from "../actions";

const PRESETS = [15, 30, 45, 60, 90] as const;

/**
 * Manual duration entry (PRODUCT_PLAN 0.4): the fallback for a forgotten timer,
 * and how demo data gets staged by hand between Loom takes.
 */
export function LogTimeDialog({
  taskId,
  taskTitle,
  dateKey,
  open,
  onOpenChange,
}: {
  taskId: string;
  taskTitle: string;
  dateKey?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [minutes, setMinutes] = useState(30);
  const { run, pending } = useAction(logTime, {
    successMessage: "Time logged.",
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log time</DialogTitle>
          <DialogDescription className="truncate">{taskTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant={minutes === preset ? "default" : "outline"}
                onClick={() => setMinutes(preset)}
              >
                {preset}m
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="log-minutes">Minutes</Label>
            <Input
              id="log-minutes"
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={pending || minutes < 1}
            onClick={() => run({ taskId, minutes, dateKey })}
          >
            Log {minutes}m
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
