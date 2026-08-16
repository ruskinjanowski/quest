"use client";

import { BarChart3, CalendarDays, Settings, Swords } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Deliberately boring navigation (PRODUCT_PLAN §2) — the novelty budget is
 * spent on Insights and the quest colouring, not here.
 */
const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/quests", label: "Quests", icon: Swords },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    // A four-column grid on phones rather than a flex row: the row sized itself
    // from its labels and pushed "Settings" off the right edge at 375px.
    <nav className="grid grid-cols-4 gap-1 lg:flex lg:flex-col">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-xs font-medium transition-colors lg:justify-start lg:gap-2.5 lg:px-3 lg:text-sm",
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
