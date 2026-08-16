import { QuestDot } from "@/components/quest-dot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Quest } from "@/db/schema";

/**
 * ⚠️ STUB — PRODUCT_PLAN 2.2. Nothing here saves.
 *
 * Its job is to make the model legible in the Loom: private by default,
 * sharing is an explicit act, per quest and per platform. The controls are
 * disabled rather than fake-functional, so nobody mistakes it for shipped.
 */

const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "anonymous", label: "Anonymous" },
  { value: "public", label: "Public" },
];

const PLATFORMS = ["X / Twitter", "Instagram", "LinkedIn", "YouTube"];

export function PrivacyStub({ quests }: { quests: readonly Quest[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Quest visibility</CardTitle>
          <CardDescription>
            Private by default. Sharing is an explicit act — per quest, not per account.
            Not wired up in the prototype.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {quests.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Create a quest to see its visibility controls.
            </p>
          )}

          {quests.map((quest) => (
            <div key={quest.id} className="flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <QuestDot color={quest.color} />
                <span className="truncate">{quest.name}</span>
              </span>

              <Select defaultValue="private" disabled>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Social links</CardTitle>
          <CardDescription>
            Per platform, so what you share on one is not what you share on another.
            Not wired up in the prototype.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 sm:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <div key={platform} className="space-y-1.5">
              <Label className="text-xs" htmlFor={`social-${platform}`}>
                {platform}
              </Label>
              <Input id={`social-${platform}`} placeholder="@handle" disabled />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
