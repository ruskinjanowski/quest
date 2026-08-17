"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Marks a surface as a visual stub — hardcoded, not wired to anything. The
 * point is honesty: several panels in the prototype (social discovery,
 * milestones, privacy) exist to show product thinking on the Loom, not to
 * function, and a viewer (or the person building this) shouldn't have to read
 * the source to tell which is which.
 *
 * The `⚠️ STUB` comments in those files say the same thing to whoever edits
 * them; this says it to whoever looks at the screen.
 */
export function DemoBadge({
  label = "Demo",
  hint = "Placeholder — hardcoded, not wired up in the prototype.",
  className,
}: {
  label?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "text-muted-foreground border-dashed font-normal",
            className,
          )}
        >
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
