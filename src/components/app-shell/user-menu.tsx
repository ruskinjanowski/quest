"use client";

import { ChevronsUpDown, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const { setTheme } = useTheme();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      {/* The trigger is the last row of the sidebar rather than a bare avatar,
          so it matches the nav links: same padding, same hover. On phones the
          rail is a horizontal bar with no room for a name, so it collapses back
          to the avatar alone. */}
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="hover:bg-muted/60 flex shrink-0 items-center gap-2.5 rounded-lg p-1.5 transition-colors lg:w-full lg:px-2 lg:py-2"
        >
          <span className="bg-muted text-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium">
            {initials || "?"}
          </span>
          <span className="hidden min-w-0 flex-1 text-left lg:block">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="text-muted-foreground block truncate text-xs">{email}</span>
          </span>
          <ChevronsUpDown className="text-muted-foreground hidden size-4 shrink-0 lg:block" />
        </button>
      </DropdownMenuTrigger>

      {/* Opens upward out of the foot of the rail; on phones the rail sits at
          the top of the screen and Radix flips it back down. */}
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="text-muted-foreground block truncate text-xs">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setTheme("light")}>
          <Sun className="size-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("dark")}>
          <Moon className="size-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("system")}>
          <Monitor className="size-4" /> System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
