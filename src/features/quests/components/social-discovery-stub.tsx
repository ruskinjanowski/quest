import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * ⚠️ STUB — PRODUCT_PLAN 2.1. Every number here is hardcoded.
 *
 * It exists to make the phase-two moat tangible in the Loom without building
 * any of it: passive inspiration, not competition. Replacing it means swapping
 * this component for a real query — nothing else in the app depends on it.
 */

const RELATED_QUESTS = [
  { name: "Read 24 books this year", members: 318 },
  { name: "Run a half marathon", members: 204 },
  { name: "Ship a side project", members: 187 },
];

export function SocialDiscoveryStub({ questName }: { questName: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4" /> Others on this quest
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <p>
          <span className="text-xl font-semibold tabular-nums">142</span>{" "}
          <span className="text-muted-foreground">
            people share “{questName}”
          </span>
        </p>

        <div>
          <p className="text-muted-foreground mb-2 text-xs">
            People on this quest also pursue
          </p>
          <ul className="space-y-1.5">
            {RELATED_QUESTS.map((related) => (
              <li key={related.name} className="flex items-center justify-between gap-3">
                <span className="truncate">{related.name}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {related.members}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-muted-foreground border-t pt-3 text-xs">
          Private by default. Sharing a quest is an explicit act, per quest and per
          platform.
        </p>
      </CardContent>
    </Card>
  );
}
