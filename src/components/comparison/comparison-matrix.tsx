"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { Startup } from "@/types";

interface ComparisonMatrixProps {
  startups: Startup[];
}

type RowDef = {
  label: string;
  getValue: (s: Startup) => string | number;
  higherIsBetter?: boolean;
};

const rows: RowDef[] = [
  {
    label: "Match Score",
    getValue: (s) => `${s.aiAnalysis.matchScore}%`,
    higherIsBetter: true,
  },
  { label: "Industry", getValue: (s) => s.industries.join(", ") },
  { label: "Funding Stage", getValue: (s) => s.fundingStage },
  {
    label: "Employees",
    getValue: (s) => s.employees.toLocaleString(),
  },
  {
    label: "Revenue",
    getValue: (s) => `$${(s.metrics.revenue / 1_000_000).toFixed(1)}M`,
    higherIsBetter: true,
  },
  {
    label: "Growth",
    getValue: (s) => `${s.metrics.revenueGrowth}%`,
    higherIsBetter: true,
  },
  { label: "Founded", getValue: (s) => s.founded.toString() },
  { label: "Location", getValue: (s) => s.location },
  {
    label: "Confidence",
    getValue: (s) => `${s.aiAnalysis.confidence}%`,
    higherIsBetter: true,
  },
];

export function ComparisonMatrix({ startups }: ComparisonMatrixProps) {
  const getBestIndex = (row: RowDef): number => {
    if (!row.higherIsBetter || startups.length < 2) return -1;
    const values = startups.map((s) => {
      const val = row.getValue(s);
      return typeof val === "string" ? parseFloat(val) : val;
    });
    const max = Math.max(...values);
    return values.indexOf(max);
  };

  return (
    <GlassCard className="overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">Comparison Matrix</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 text-left font-medium text-foreground-muted">
              Metric
            </th>
            {startups.map((s) => (
              <th key={s.id} className="pb-3 text-center font-medium">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const bestIdx = getBestIndex(row);
            return (
              <tr key={row.label} className="border-b border-border/50">
                <td className="py-3 text-foreground-muted">{row.label}</td>
                {startups.map((s, i) => (
                  <td
                    key={s.id}
                    className={cn(
                      "py-3 text-center font-code",
                      bestIdx === i && "text-highlight font-medium"
                    )}
                  >
                    {row.getValue(s)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </GlassCard>
  );
}
