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
      {/* `h-dvh` alone gave the rail a fixed one-screen box that scrolled away
          with the page, so its background and right border stopped mid-page on
          anything taller than the viewport. Sticky pins it instead: navigation
          stays reachable, and the border runs the full height of what you see.
          `self-start` keeps the flex row from stretching it back out, which
          would leave it nothing to stick within. */}
      <aside className="bg-muted/30 flex shrink-0 flex-col gap-6 border-b p-3 lg:sticky lg:top-0 lg:h-dvh lg:w-56 lg:self-start lg:border-r lg:border-b-0 lg:p-4">
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
