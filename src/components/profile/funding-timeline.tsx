import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import type { FundingStage } from "@/types";

const allStages: FundingStage[] = [
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
  "IPO",
];

interface FundingTimelineProps {
  currentStage: FundingStage;
  totalFunding: number;
}

export function FundingTimeline({
  currentStage,
  totalFunding,
}: FundingTimelineProps) {
  const currentIndex = allStages.indexOf(currentStage);

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Funding Journey</h2>
        <span className="font-code text-sm text-foreground-muted">
          Total: ${(totalFunding / 1_000_000).toFixed(1)}M
        </span>
      </div>

      <div className="flex items-center gap-1">
        {allStages.map((stage, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={stage} className="flex flex-1 flex-col items-center">
              <div
                className={cn(
                  "h-2 w-full rounded-full",
                  isPast && "bg-sage",
                  isCurrent && "bg-highlight",
                  isFuture && "bg-background-tertiary"
                )}
              />
              <span
                className={cn(
                  "mt-2 text-xs",
                  isCurrent
                    ? "font-medium text-highlight"
                    : "text-foreground-muted"
                )}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
