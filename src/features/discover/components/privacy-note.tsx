import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * The privacy model, stated on every screen that shows other people rather than
 * buried in a footer. The moment someone sees a stranger's name in this app
 * their next thought is "wait — am I in a list somewhere too", and the answer
 * has to be on the same screen as the question.
 *
 * It's also the line to say out loud in the Loom: private by default, sharing
 * is an explicit act, per quest and per platform (PRODUCT_PLAN 2.2).
 */
export function PrivacyNote() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed px-3 py-2 text-xs">
      <Lock className="size-3.5 shrink-0" />
      <span>
        You are not listed here. A quest of yours appears only once you make it
        public — per quest, and per platform.
      </span>
      <Link href="/settings" className="text-foreground underline underline-offset-2">
        Manage visibility
      </Link>
    </div>
  );
}
