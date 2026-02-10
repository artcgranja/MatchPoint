"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import type { Startup } from "@/types";

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

interface ComparisonBarChartProps {
  startups: Startup[];
}

export function ComparisonBarChart({ startups }: ComparisonBarChartProps) {
  const metrics = [
    {
      name: "Match Score",
      getData: (s: Startup) => s.aiAnalysis.matchScore,
    },
    {
      name: "Revenue Growth",
      getData: (s: Startup) => s.metrics.revenueGrowth,
    },
    {
      name: "Employees",
      getData: (s: Startup) => s.employees,
    },
    {
      name: "NPS",
      getData: (s: Startup) => s.metrics.nps,
    },
  ];

  const data = metrics.map(({ name, getData }) => {
    const point: Record<string, string | number> = { metric: name };
    startups.forEach((s) => {
      point[s.name] = getData(s);
    });
    return point;
  });

  return (
    <GlassCard>
      <h2 className="text-lg font-semibold mb-4">Metrics Comparison</h2>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="metric"
              tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
            />
            <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            {startups.map((s, i) => (
              <Bar
                key={s.id}
                dataKey={s.name}
                fill={chartColors[i]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
