"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CompanyStatusBannerProps {
  status: string;
}

export function CompanyStatusBanner({ status }: CompanyStatusBannerProps) {
  const t = useTranslations("CompanyProfile");

  if (status === "Active") return null;

  return (
    <GlassCard className="border-amber-500/20 bg-amber-500/5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium">{t("statusBannerTitle")}</p>
            <p className="text-xs text-foreground-muted">
              {t("statusBannerDescription")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => toast.success(t("activationRequested"))}
        >
          {t("requestActivation")}
        </Button>
      </div>
    </GlassCard>
  );
}
