"use client";

import { ExternalLink, GitCompareArrows, FileText, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { useComparisonStore } from "@/stores/comparison-store";
import type { Startup } from "@/types";

interface StartupHeaderProps {
  startup: Startup;
}

export function StartupHeader({ startup }: StartupHeaderProps) {
  const { addStartup, removeStartup, isSelected } = useComparisonStore();
  const selected = isSelected(startup.id);

  return (
    <GlassCard>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-highlight/10 font-code text-xl font-bold text-highlight">
            {startup.logo}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{startup.name}</h1>
            <p className="text-foreground-muted">{startup.tagline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {startup.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Founded {startup.founded}
              </span>
              <a
                href={startup.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-highlight hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Website
              </a>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {startup.industries.map((i) => (
                <Badge key={i} variant="secondary">{i}</Badge>
              ))}
              {startup.technologies.slice(0, 3).map((t) => (
                <Badge key={t} variant="outline">{t}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <div className="text-4xl font-bold font-code text-highlight">
              {startup.aiAnalysis.matchScore}%
            </div>
            <p className="text-sm text-foreground-muted">Match Score</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selected ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() =>
                selected
                  ? removeStartup(startup.id)
                  : addStartup(startup.id)
              }
            >
              <GitCompareArrows className="h-4 w-4" />
              {selected ? "In Compare" : "Compare"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Report
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
