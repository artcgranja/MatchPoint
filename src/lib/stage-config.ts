import { MessageSquare, FileText, Rocket } from "lucide-react";
import type { SessionPipelineStage } from "@/types";

export const STAGE_CONFIG: Record<
  SessionPipelineStage,
  {
    icon: typeof MessageSquare;
    color: string;
    iconBg: string;
    borderAccent: string;
  }
> = {
  discovery: {
    icon: MessageSquare,
    color: "text-blue-400",
    iconBg: "bg-blue-500/10",
    borderAccent: "border-l-blue-500/50",
  },
  analysis: {
    icon: FileText,
    color: "text-amber-400",
    iconBg: "bg-amber-500/10",
    borderAccent: "border-l-amber-500/50",
  },
  results: {
    icon: Rocket,
    color: "text-green-400",
    iconBg: "bg-green-500/10",
    borderAccent: "border-l-green-500/50",
  },
};

export const STAGE_ORDER: SessionPipelineStage[] = ["results", "analysis", "discovery"];
