"use client";

import { useTranslations } from "next-intl";
import { Tag } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface TagsSectionProps {
  industries: string[];
  tags: string[];
}

export function TagsSection({ industries, tags }: TagsSectionProps) {
  const t = useTranslations("CompanyProfile");

  const hasContent = industries.length > 0 || tags.length > 0;

  return (
    <GlassCard>
      <div className="mb-4">
        <h3 className="text-base font-semibold">{t("tagsSection")}</h3>
        <p className="text-sm text-foreground-muted">{t("tagsDescription")}</p>
      </div>

      {!hasContent ? (
        <p className="text-sm text-foreground-muted italic">{t("noTags")}</p>
      ) : (
        <div className="space-y-4">
          {/* Industries */}
          {industries.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {t("industries")}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {industries.map((industry) => (
                  <span
                    key={industry}
                    className="rounded-md bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground-muted border border-border"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-foreground-muted" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  {t("tags")}
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground-muted border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
