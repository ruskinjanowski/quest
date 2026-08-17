import Link from "next/link";
import { QuestDot } from "@/components/quest-dot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Alert } from "../queries";

/**
 * The quests this week has quietly ignored.
 *
 * The split says *what* happened; this says *what didn't*, which is the harder
 * and more useful half. Only two kinds of alert fire — nothing at all, or well
 * short of a target you set yourself — because a list that flags everything
 * flags nothing.
 */
export function AttentionCard({ alerts }: { alerts: readonly Alert[] }) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Needs attention</CardTitle>
      </CardHeader>

      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-sm text-balance">
            Every active quest got some time this past week. That&apos;s the whole idea.
          </p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li key={alert.questId}>
                <Link
                  href={`/quests/${alert.questId}`}
                  className="flex items-center gap-2 text-sm font-medium hover:underline"
                >
                  <QuestDot color={alert.color} />
                  <span className="truncate">{alert.name}</span>
                </Link>
                <p className="text-muted-foreground ml-4.5 text-xs">{alert.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
