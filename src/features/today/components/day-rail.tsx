"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * The right-hand rail: the day drawn on a clock, or the week's quests.
 *
 * Sunsama fills this space with a synced calendar. Nothing here is synced (see
 * Settings for what that would mean), so it shows the two things this app can
 * say honestly: where the plan lands on a clock, and which quests the week is
 * moving. Collapsible, because on a laptop the board deserves the width.
 */
export function DayRail({
  timeline,
  quests,
  dayLabel,
}: {
  timeline: ReactNode;
  quests: ReactNode;
  dayLabel: string;
}) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <div className="hidden lg:block">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Show the day rail"
          onClick={() => setOpen(true)}
        >
          <PanelRightOpen className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <Tabs defaultValue="timeline">
        <div className="mb-3 flex items-center gap-2">
          <TabsList className="h-8">
            <TabsTrigger value="timeline" className="text-xs">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="quests" className="text-xs">
              Quests
            </TabsTrigger>
          </TabsList>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden size-8 lg:inline-flex"
            aria-label="Hide the day rail"
            onClick={() => setOpen(false)}
          >
            <PanelRightClose className="size-4" />
          </Button>
        </div>

        <TabsContent value="timeline">
          <p className="text-muted-foreground mb-2 text-xs">
            {dayLabel}, projected from your estimates
          </p>
          {timeline}
        </TabsContent>

        <TabsContent value="quests">
          <p className="text-muted-foreground mb-3 text-xs">Finished in the last 7 days</p>
          {quests}
        </TabsContent>
      </Tabs>
    </aside>
  );
}
