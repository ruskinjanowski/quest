import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetDemoDataButton } from "@/features/demo/components/reset-demo-data-button";
import { listQuests } from "@/features/quests/queries";
import { IntegrationsStub } from "@/features/settings/components/integrations-stub";
import { PrivacyStub } from "@/features/settings/components/privacy-stub";
import { DAY_CAPACITY_MINUTES, DAY_START_MINUTE } from "@/features/tasks/domain";
import { requireUser } from "@/lib/session";
import { formatTimeOfDay } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone.server";

export const metadata: Metadata = { title: "Settings · Quest" };

export default async function SettingsPage() {
  const user = await requireUser();
  const timeZone = await getTimeZone();
  const quests = await listQuests(user.id);
  const demoResetEnabled = process.env.ALLOW_DEMO_RESET === "true";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Your account, and the two integrations this product is eventually about."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p>{user.name}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>

            <dl className="text-muted-foreground grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
              <div className="flex justify-between gap-2 sm:block">
                <dt className="inline">Week starts</dt>{" "}
                <dd className="text-foreground inline">Monday</dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="inline">Day starts</dt>{" "}
                <dd className="text-foreground inline">
                  {formatTimeOfDay(DAY_START_MINUTE)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="inline">Planning capacity</dt>{" "}
                <dd className="text-foreground inline">
                  {DAY_CAPACITY_MINUTES / 60}h a day
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="inline">Time zone</dt>{" "}
                <dd className="text-foreground inline">{timeZone}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <IntegrationsStub />

        <PrivacyStub quests={quests} />

        {demoResetEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Demo data</CardTitle>
              <CardDescription>
                Replaces this account&apos;s quests and tasks with the seeded
                four-week story. Only affects your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResetDemoDataButton />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
