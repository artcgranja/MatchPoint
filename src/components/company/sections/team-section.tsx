"use client";

import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";

interface TeamSectionProps {
  teamSize: number;
  isHiring: boolean;
  onToggleHiring: (value: boolean) => void;
}

export function TeamSection({
  teamSize,
  isHiring,
  onToggleHiring,
}: TeamSectionProps) {
  const t = useTranslations("CompanyProfile");

  return (
    <GlassCard>
      <div className="mb-4">
        <h3 className="text-base font-semibold">{t("teamSection")}</h3>
        <p className="text-sm text-foreground-muted">{t("teamDescription")}</p>
      </div>

      <div className="space-y-4">
        {/* Team size — read-only */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-foreground-muted" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              {t("teamSize")}
            </h4>
          </div>
          <p className="text-sm text-foreground/90">
            {t("members", { count: teamSize })}
          </p>
        </div>

        {/* Hiring toggle — saves immediately */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="hiring-toggle">{t("hiring")}</Label>
            <p className="text-xs text-foreground-muted">
              {isHiring ? t("hiringYes") : t("hiringNo")}
            </p>
          </div>
          <Switch
            id="hiring-toggle"
            checked={isHiring}
            onCheckedChange={onToggleHiring}
          />
        </div>
      </div>
    </GlassCard>
  );
}
