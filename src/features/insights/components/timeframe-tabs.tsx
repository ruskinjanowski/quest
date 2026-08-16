"use client";

import Link from "next/link";
import { TIMEFRAMES, type Timeframe } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * PRODUCT_PLAN 1.6. The timeframe lives in the URL rather than component state,
 * so a view is linkable and the server does the aggregation — which is cheap
 * because every Insights query already takes a date range.
 */
export function TimeframeTabs({ active }: { active: Timeframe }) {
  return (
    <div className="bg-muted inline-flex rounded-lg p-0.5" role="tablist">
      {TIMEFRAMES.map((timeframe) => (
        <Link
          key={timeframe.value}
          href={`/insights?timeframe=${timeframe.value}`}
          role="tab"
          aria-selected={active === timeframe.value}
          scroll={false}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            active === timeframe.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {timeframe.label}
        </Link>
      ))}
    </div>
  );
}
