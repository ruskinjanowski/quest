import type { QuestHealth } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QUEST_HEALTH_CLASSES, QUEST_HEALTH_LABELS } from "../labels";

export function QuestHealthBadge({
  health,
  className,
}: {
  health: QuestHealth | null;
  className?: string;
}) {
  if (!health) return null;

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", QUEST_HEALTH_CLASSES[health], className)}
    >
      {QUEST_HEALTH_LABELS[health]}
    </Badge>
  );
}
