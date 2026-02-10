"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getColor(value: number) {
  if (value >= 75) return "#6B8E6B";
  if (value >= 50) return "#f59e0b";
  return "#ef4444";
}

export function ConfidenceMeter({
  value,
  size = "md",
  className,
}: ConfidenceMeterProps) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [value, motionValue]);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex-1 overflow-hidden rounded-full bg-background-tertiary",
          sizeClasses[size]
        )}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getColor(value) }}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <motion.span className="font-code text-sm tabular-nums min-w-[3ch] text-right">
        {display}
      </motion.span>
    </div>
  );
}
