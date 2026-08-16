import type { ReactNode } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { UserMenu } from "@/components/app-shell/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TodayCounter } from "@/features/time-tracking/components/today-counter";
import { requireUser } from "@/lib/session";

/**
 * The signed-in shell. Every page under it can assume a session exists, which
 * is why `requireUser()` lives here rather than being repeated in each page.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="bg-muted/30 flex shrink-0 flex-col gap-6 border-b p-3 lg:h-dvh lg:w-56 lg:border-r lg:border-b-0 lg:p-4">
        <Link href="/today" className="hidden px-2 text-lg font-semibold lg:block">
          Quest
        </Link>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b px-4 backdrop-blur lg:px-8">
          <Suspense fallback={<Skeleton className="h-5 w-44" />}>
            <TodayCounter />
          </Suspense>
          <UserMenu name={user.name} email={user.email} />
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
