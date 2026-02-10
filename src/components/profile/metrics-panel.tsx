"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import type { StartupMetrics } from "@/types";

interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
}

function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toLocaleString(),
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => format(v));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [value, motionValue]);

  return <motion.span>{display}</motion.span>;
}

interface MetricsPanelProps {
  metrics: StartupMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const items = [
    {
      label: "Revenue",
      value: metrics.revenue,
      format: (v: number) =>
        `$${(v / 1_000_000).toFixed(1)}M`,
    },
    {
      label: "Growth",
      value: metrics.revenueGrowth,
      format: (v: number) => `${Math.round(v)}%`,
    },
    {
      label: "Customers",
      value: metrics.customers,
      format: (v: number) => Math.round(v).toLocaleString(),
    },
    {
      label: "NPS",
      value: metrics.nps,
      format: (v: number) => Math.round(v).toString(),
    },
    {
      label: "Burn Rate",
      value: metrics.burnRate,
      format: (v: number) =>
        `$${(v / 1_000).toFixed(0)}K/mo`,
    },
    {
      label: "Runway",
      value: metrics.runway,
      format: (v: number) => `${Math.round(v)} months`,
    },
  ];

  return (
    <GlassCard>
      <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map(({ label, value, format }) => (
          <div
            key={label}
            className="rounded-lg bg-background-secondary/50 p-3 text-center"
          >
            <p className="font-code text-xl font-bold">
              <AnimatedNumber value={value} format={format} />
            </p>
            <p className="text-xs text-foreground-muted mt-1">{label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
