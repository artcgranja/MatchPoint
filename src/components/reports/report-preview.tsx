"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { ReportSection } from "./report-section";
import type { Startup } from "@/types";

interface ReportPreviewProps {
  startups: Startup[];
}

export function ReportPreview({ startups }: ReportPreviewProps) {
  const topMatches = startups.slice(0, 5);

  return (
    <GlassCard className="max-w-4xl mx-auto space-y-8">
      <div className="text-center border-b border-border pb-6">
        <p className="text-xs text-foreground-muted uppercase tracking-wider">
          MatchPoint Analysis Report
        </p>
        <h2 className="text-2xl font-bold mt-2">
          Startup Matching Report
        </h2>
        <p className="text-sm text-foreground-muted mt-1">
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>

      <ReportSection title="Executive Summary">
        <p>
          This report presents the results of an AI-powered analysis of{" "}
          {startups.length} startups matching your business challenge. Our
          five-agent pipeline evaluated each startup across technology fit,
          market alignment, team strength, financial health, innovation
          potential, and scalability.
        </p>
        <p className="mt-2">
          The top match achieved a score of{" "}
          <strong className="text-foreground">
            {topMatches[0]?.aiAnalysis.matchScore ?? 0}%
          </strong>
          , with {topMatches.filter((s) => s.aiAnalysis.matchScore >= 80).length}{" "}
          startups scoring above 80%.
        </p>
      </ReportSection>

      <ReportSection title="Top Matches">
        <div className="space-y-3">
          {topMatches.map((startup, i) => (
            <div
              key={startup.id}
              className="flex items-center justify-between rounded-lg bg-background-secondary/50 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-code text-sm text-foreground-muted">
                  #{i + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{startup.name}</p>
                  <p className="text-xs">{startup.industries.join(", ")}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-code font-bold text-highlight">
                  {startup.aiAnalysis.matchScore}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Recommendations">
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="h-1.5 w-1.5 mt-1.5 shrink-0 rounded-full bg-highlight" />
            Schedule discovery calls with the top 3 matching startups to
            assess cultural fit and partnership potential.
          </li>
          <li className="flex gap-2">
            <span className="h-1.5 w-1.5 mt-1.5 shrink-0 rounded-full bg-highlight" />
            Request detailed technical documentation from high-scoring
            technology fit candidates.
          </li>
          <li className="flex gap-2">
            <span className="h-1.5 w-1.5 mt-1.5 shrink-0 rounded-full bg-highlight" />
            Consider a pilot program with the top match to validate
            integration feasibility before full commitment.
          </li>
        </ul>
      </ReportSection>
    </GlassCard>
  );
}
