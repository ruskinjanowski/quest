"use client";

import { CalendarDays, Home, Inbox, Settings, Swords } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Deliberately boring navigation (PRODUCT_PLAN §2) — the novelty budget is
 * spent on Insights and the quest colouring, not here.
 */
const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/quests", label: "Quests", icon: Swords },
  { href: "/backlog", label: "Backlog", icon: Inbox },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    // A fixed grid on phones rather than a flex row: the row sized itself from
    // its labels and pushed the last item off the right edge at 375px.
    <nav className="grid grid-cols-5 gap-1 lg:flex lg:flex-col">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              // Stacked on phones: the account row now shares the bar, and a
              // side-by-side icon and label no longer leave enough width for
              // "Backlog" to render unclipped.
              "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors lg:flex-row lg:justify-start lg:gap-2.5 lg:px-3 lg:py-2 lg:text-sm",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
