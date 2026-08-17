"use client";

import { AtSign } from "lucide-react";
import { DemoBadge } from "@/components/demo-badge";
import { QuestDot } from "@/components/quest-dot";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PersonAvatar } from "./person-avatar";
import type { SharedQuestMember } from "../data";

/**
 * ⚠️ STUB — PRODUCT_PLAN 2.1. Nobody here is real.
 *
 * One row per person, opening their profile. What a profile leads with is the
 * whole argument for social living in this app: not a follower count, but a
 * *rhythm* — 8.4h/week since November, and what's next. That's the thing you
 * can only know about someone if you've both been measuring the split.
 *
 * Social links are shown, not navigable: they'd 404, and a dead link in a demo
 * is worse than an honest one. The `DemoBadge` in the dialog says so.
 */
export function PersonCard({
  person,
  bucketColor,
}: {
  person: SharedQuestMember;
  bucketColor: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="hover:border-foreground/20 focus-visible:border-foreground/20 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
        >
          <PersonAvatar name={person.name} />

          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="truncate text-sm font-medium">{person.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {person.location}
              </span>
            </span>
            <span className="text-muted-foreground mt-0.5 block truncate text-xs">
              {person.phrasing}
            </span>
          </span>

          <span className="shrink-0 text-right">
            <span className="block text-sm font-medium tabular-nums">
              {person.hoursPerWeek.toFixed(1)}h
            </span>
            <span className="text-muted-foreground block text-[11px]">per week</span>
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <PersonAvatar name={person.name} size="lg" />
            <div className="min-w-0">
              <DialogTitle className="truncate text-base">{person.name}</DialogTitle>
              <DialogDescription>{person.location}</DialogDescription>
            </div>
            <DemoBadge
              // `mr-6` clears the dialog's own close button, which sits in the
              // same top-right corner.
              className="mr-6 ml-auto self-start"
              hint="An invented profile. Social discovery is a phase-two idea — nothing here is wired up."
            />
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border p-3">
            <p className="flex items-center gap-2 font-medium">
              <QuestDot color={bucketColor} />
              <span className="truncate">{person.phrasing}</span>
            </p>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">
                {person.hoursPerWeek.toFixed(1)}h
              </span>
              <span className="text-muted-foreground text-xs">
                a week, since {person.since}
              </span>
            </div>

            <p className="text-muted-foreground mt-2 text-xs">
              Next: {person.nextTask}
            </p>
          </div>

          <p className="text-muted-foreground text-pretty">“{person.note}”</p>

          <div>
            <p className="text-muted-foreground mb-2 text-xs">Links</p>
            {person.links.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No links shared. Visible on this quest, and nowhere else.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {person.links.map((link) => (
                  <li
                    key={link.platform}
                    className="text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                  >
                    <AtSign className="size-3" />
                    <span className="text-foreground">{link.handle}</span>
                    <span>· {link.platform}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-muted-foreground border-t pt-3 text-xs">
            Shown because this quest is public. Sharing is per quest and per
            platform — a public quest doesn’t make an account public.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
