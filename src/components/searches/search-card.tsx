"use client";

import { motion } from "motion/react";
import { Building2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { STAGE_CONFIG } from "@/lib/stage-config";
import { useRelativeTime } from "@/hooks/use-relative-time";
import type { SessionPipelineStage } from "@/types";

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
  const tSearches = useTranslations("Searches");
  const getRelativeTime = useRelativeTime();

  const style = STAGE_CONFIG[search.stage];
  const Icon = style.icon;

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
