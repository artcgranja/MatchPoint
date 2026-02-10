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
import type { RadarScore } from "@/types";

interface StartupRadarProps {
  radarScores: RadarScore[];
  name: string;
}

export function StartupRadar({ radarScores, name }: StartupRadarProps) {
  return (
    <GlassCard>
      <h2 className="text-lg font-semibold mb-4">Performance Radar</h2>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarScores}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
            />
            <Radar
              name={name}
              dataKey="score"
              stroke="var(--highlight)"
              fill="var(--highlight)"
              fillOpacity={0.2}
            />
            <Radar
              name="Benchmark"
              dataKey="benchmark"
              stroke="var(--sage)"
              fill="var(--sage)"
              fillOpacity={0.1}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
