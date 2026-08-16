"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatHours } from "@/lib/duration";
import { ADMIN_COLOR } from "@/lib/quest-colors";
import type { TrendPoint } from "../domain";

/**
 * PRODUCT_PLAN 1.5 — four weeks of quest vs. admin. One week is a snapshot;
 * a trend is what answers "did my time match my ambitions".
 */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const data = points.map((point) => ({
    label: point.label,
    quest: Number((point.questMinutes / 60).toFixed(2)),
    admin: Number((point.adminMinutes / 60).toFixed(2)),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            width={48}
            tickFormatter={(value: number) => `${value}h`}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: 12,
            }}
            formatter={(value, name) => [
              formatHours(Number(value) * 60),
              name === "quest" ? "Quests" : "Admin",
            ]}
          />
          <Bar dataKey="quest" stackId="time" fill="var(--primary)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="admin" stackId="time" fill={ADMIN_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
