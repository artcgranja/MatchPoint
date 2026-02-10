"use client";

import {
  Building2,
  AlertTriangle,
  Target,
  SlidersHorizontal,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScopePhase } from "@/types";

const PHASES: {
  key: ScopePhase;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "situation", label: "Situacao", icon: Building2 },
  { key: "challenge", label: "Desafios", icon: AlertTriangle },
  { key: "objectives", label: "Objetivos", icon: Target },
  { key: "parameters", label: "Parametros", icon: SlidersHorizontal },
  { key: "evaluation", label: "Avaliacao", icon: Scale },
];

const PHASE_ORDER: ScopePhase[] = [
  "situation",
  "challenge",
  "objectives",
  "parameters",
  "evaluation",
  "complete",
];

interface PhaseIndicatorProps {
  currentPhase: ScopePhase;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1">
      {PHASES.map((phase, index) => {
        const phaseIdx = PHASE_ORDER.indexOf(phase.key);
        const isComplete = phaseIdx < currentIdx;
        const isCurrent = phase.key === currentPhase;
        const Icon = phase.icon;

        return (
          <div key={phase.key} className="flex items-center">
            {/* Phase dot/icon */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  isComplete && "bg-sage/15 text-sage",
                  isCurrent && "bg-highlight/15 text-highlight",
                  !isComplete && !isCurrent && "bg-foreground-muted/10 text-foreground-muted/40"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {/* Label — only show on md+ */}
              <span
                className={cn(
                  "hidden text-[10px] font-medium md:block",
                  isComplete && "text-sage",
                  isCurrent && "text-highlight",
                  !isComplete && !isCurrent && "text-foreground-muted/40"
                )}
              >
                {phase.label}
              </span>
            </div>

            {/* Connector line */}
            {index < PHASES.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px w-6 md:w-10 self-start mt-4",
                  phaseIdx < currentIdx ? "bg-sage/50" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}

      {/* Mobile: show current phase name */}
      <span className="ml-3 text-xs font-medium text-highlight md:hidden">
        {PHASES.find((p) => p.key === currentPhase)?.label ??
          (currentPhase === "complete" ? "Concluido" : "")}
      </span>
    </div>
  );
}
