"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * ⚠️ STUB — nothing here connects to anything.
 *
 * Calendar sync and task-planner imports are P3 in PRODUCT_PLAN: named in the
 * three-month plan, not built for the prototype. They earn a page anyway,
 * because the shape of the integration is a product decision worth showing —
 * particularly the one line that makes it a *Quest* integration rather than a
 * generic one: imported work arrives with no quest attached, and attaching it
 * is the whole point.
 *
 * Each "Connect" opens that explanation rather than a dead button or a fake
 * OAuth screen. Better on camera, and honest about what exists.
 */

type Integration = {
  name: string;
  blurb: string;
};

const CALENDARS: Integration[] = [
  { name: "Google Calendar", blurb: "Meetings appear as fixed blocks on the day." },
  { name: "Outlook", blurb: "Same two-way sync, for work accounts." },
  { name: "Apple Calendar", blurb: "Via CalDAV, for people who live in iCloud." },
  { name: "CalDAV", blurb: "Anything else that speaks the standard." },
];

const PLANNERS: Integration[] = [
  { name: "Jira", blurb: "Issues assigned to you, pulled into the backlog." },
  { name: "ClickUp", blurb: "Tasks from the lists you choose." },
  { name: "Linear", blurb: "Your current cycle, as tasks." },
  { name: "Asana", blurb: "My Tasks, mirrored." },
  { name: "Todoist", blurb: "Personal inbox and projects." },
  { name: "Notion", blurb: "A database of tasks, by view." },
  { name: "Trello", blurb: "Cards from the boards you pick." },
  { name: "GitHub Issues", blurb: "Issues and PRs waiting on you." },
];

export function IntegrationsStub() {
  const [selected, setSelected] = useState<
    (Integration & { kind: "calendar" | "planner" }) | null
  >(null);

  return (
    <>
      <IntegrationCard
        title="Calendars"
        description="Two-way sync: your meetings appear in the day, your planned tasks appear in your calendar — so the plan you make is a plan that fits."
        items={CALENDARS}
        onSelect={(item) => setSelected({ ...item, kind: "calendar" })}
      />

      <IntegrationCard
        title="Task planners"
        description="Pull work in from wherever your team already tracks it, then attach it to a quest."
        items={PLANNERS}
        onSelect={(item) => setSelected({ ...item, kind: "planner" })}
      />

      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.blurb}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground text-balance">
              {selected?.kind === "calendar"
                ? "Synced events would sit on the day's timeline as time you've already spent — so a day with four hours of meetings can't also hold eight hours of tasks."
                : "Imported tasks land in the backlog with no quest attached. Attaching them is the point: work that arrives from somewhere else is exactly the work most likely to be admin in disguise."}
            </p>
            <p className="text-muted-foreground text-balance">
              Not built for this prototype — it&apos;s in the three-month plan.
            </p>
          </div>

          <DialogFooter>
            <Button disabled>Connect {selected?.name}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function IntegrationCard({
  title,
  description,
  items,
  onSelect,
}: {
  title: string;
  description: string;
  items: readonly Integration[];
  onSelect: (item: Integration) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription className="text-balance">{description}</CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0">
            Coming soon
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => onSelect(item)}
            className="hover:border-foreground/20 hover:bg-muted/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors"
          >
            <span className="truncate">{item.name}</span>
            <span className="text-muted-foreground shrink-0 text-xs">Connect</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
