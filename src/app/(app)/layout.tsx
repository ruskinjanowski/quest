import type { ReactNode } from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { UserMenu } from "@/components/app-shell/user-menu";
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
      <aside className="bg-muted/30 flex shrink-0 items-center gap-3 border-b p-3 lg:sticky lg:top-0 lg:h-dvh lg:w-56 lg:flex-col lg:items-stretch lg:gap-6 lg:self-start lg:border-r lg:border-b-0 lg:p-4">
        <Link href="/home" className="hidden px-2 text-lg font-semibold lg:block">
          Quest
        </Link>

        {/* `flex-1` on the nav's wrapper is what pushes the account row to the
            foot of the rail on desktop, and keeps it at the right-hand end of
            the bar on phones. */}
        <div className="min-w-0 flex-1">
          <SidebarNav />
        </div>

        <UserMenu name={user.name} email={user.email} />
      </aside>

      {/* There is no top bar: it only ever carried the avatar, which now sits
          in the rail. The header used to carry a live quest/admin counter
          beside a running timer; with the timer gone that number belongs where
          it is now — under the first day column, and on Home. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
