import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetDemoDataButton } from "@/features/demo/components/reset-demo-data-button";
import { listQuests } from "@/features/quests/queries";
import { PrivacyStub } from "@/features/settings/components/privacy-stub";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Settings · Quest" };

export default async function SettingsPage() {
  const user = await requireUser();
  const quests = await listQuests(user.id);
  const demoResetEnabled = process.env.ALLOW_DEMO_RESET === "true";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Account</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{user.name}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </CardContent>
        </Card>

        <PrivacyStub quests={quests} />

        {demoResetEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Demo data</CardTitle>
              <CardDescription>
                Replaces this account&apos;s quests, tasks and tracked time with the
                seeded four-week story. Only affects your account.
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
