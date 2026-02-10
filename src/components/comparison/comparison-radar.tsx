"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
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

interface ComparisonRadarProps {
  startups: Startup[];
}

export function ComparisonRadar({ startups }: ComparisonRadarProps) {
  const dimensions =
    startups[0]?.aiAnalysis.radarScores.map((r) => r.dimension) ?? [];

  const data = dimensions.map((dim) => {
    const point: Record<string, string | number> = { dimension: dim };
    startups.forEach((s) => {
      const score = s.aiAnalysis.radarScores.find(
        (r) => r.dimension === dim
      );
      point[s.name] = score?.score ?? 0;
    });
    return point;
  });

  return (
    <GlassCard>
      <h2 className="text-lg font-semibold mb-4">Radar Comparison</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
            />
            {startups.map((s, i) => (
              <Radar
                key={s.id}
                name={s.name}
                dataKey={s.name}
                stroke={chartColors[i]}
                fill={chartColors[i]}
                fillOpacity={0.1}
              />
            ))}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
