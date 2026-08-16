import { DemoBadge } from "@/components/demo-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestHealthBadge } from "./quest-health-badge";
import type { QuestHealth } from "@/db/schema";

/**
 * ⚠️ STUB — PRODUCT_PLAN 2.4. Display-only, hardcoded.
 *
 * Mirrors Focus.so's Jahresziel → Meilensteine structure so the Loom can show
 * that we saw the hierarchy and chose a flat model on purpose (open question 8),
 * without committing the data model to it.
 */

const MILESTONES: { name: string; health: QuestHealth }[] = [
  { name: "First milestone", health: "achieved" },
  { name: "Second milestone", health: "on_track" },
  { name: "Third milestone", health: "at_risk" },
];

export function MilestonesStub() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          Milestones
          <DemoBadge
            className="ml-auto"
            hint="Display-only. The prototype's quests are flat; milestones are shown to illustrate the shape, not stored."
          />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2.5">
          {MILESTONES.map((milestone) => (
            <li key={milestone.name} className="flex items-center justify-between gap-3">
              <span className="truncate text-sm">{milestone.name}</span>
              <QuestHealthBadge health={milestone.health} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
