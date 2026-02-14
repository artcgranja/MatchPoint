"use client";

import { motion } from "motion/react";
import { MessageSquare, FileText, Rocket, Building2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { SessionPipelineStage } from "@/types";

const STAGE_STYLE: Record<
  SessionPipelineStage,
  { icon: typeof MessageSquare; color: string; iconBg: string; borderAccent: string }
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
    color: "text-green-500",
    iconBg: "bg-green-500/10",
    borderAccent: "border-l-green-500/50",
  },
};

interface SearchCardProps {
  search: {
    id: string;
    discoverySessionId: string | null;
    sessionTitle: string;
    stage: SessionPipelineStage;
    resultCount: number;
    preview: string | null;
    topStartups: string[] | null;
    createdAt: string;
    updatedAt: string;
  };
}

export function SearchCard({ search }: SearchCardProps) {
  const router = useRouter();
  const tTime = useTranslations("RelativeTime");
  const tSearches = useTranslations("Searches");

  const style = STAGE_STYLE[search.stage];
  const Icon = style.icon;

  function getRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return tTime("now");
    if (diffMins < 60) return tTime("minutesAgo", { minutes: diffMins });
    if (diffHours < 24) return tTime("hoursAgo", { hours: diffHours });
    if (diffDays === 1) return tTime("yesterday");
    if (diffDays < 7) return tTime("daysAgo", { days: diffDays });
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const handleClick = () => {
    if (search.discoverySessionId) {
      router.push(`/?session=${search.discoverySessionId}`);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 rounded-lg border border-l-2 p-4 transition-all",
        style.borderAccent,
        "border-border/40 hover:border-foreground-muted/20 hover:bg-background-secondary/50"
      )}
    >
      {/* Header: icon, title, timestamp */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded",
            style.iconBg
          )}
        >
          <Icon className={cn("h-4 w-4", style.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground">
            {search.sessionTitle}
          </h3>
          <p className="text-xs text-foreground-muted/50">
            {getRelativeTime(search.updatedAt)}
          </p>
        </div>
      </div>

      {/* Preview or results info */}
      {search.stage === "results" && search.topStartups && search.topStartups.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-3 w-3 shrink-0 text-green-400/50" />
            <span className="text-xs font-medium text-green-400/70">
              {tSearches("resultCount", { count: search.resultCount })}
            </span>
          </div>
          <p className="line-clamp-2 text-xs text-foreground-muted/50">
            {search.topStartups.slice(0, 3).join(", ")}
            {search.resultCount > 3 && ` +${search.resultCount - 3} more`}
          </p>
        </div>
      ) : search.preview ? (
        <p className="line-clamp-2 text-xs text-foreground-muted/50">
          {search.preview}
        </p>
      ) : null}
    </motion.div>
  );
}
