"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { MapPin, ExternalLink, Users, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cardEntrance } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/saved/save-button";
import { ConnectButton } from "@/components/connections/connect-button";
import { StartupDetailDialog } from "@/components/discovery/startup-detail-dialog";
import { CompanyDetailDialog } from "@/components/descubra/company-detail-dialog";
import { apiGet } from "@/lib/api/client";
import type { StartupCard, BrowseCompany, BrowseCompanyDetail } from "@/types";

type CompanyCardProps =
  | { mode: "search"; company: StartupCard }
  | { mode: "browse"; company: BrowseCompany };

export function CompanyCard(props: CompanyCardProps) {
  const { mode, company } = props;
  const t = useTranslations("Browse");
  const [detailOpen, setDetailOpen] = useState(false);
  const [browseDetail, setBrowseDetail] = useState<BrowseCompanyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const logoUrl = company.smallLogoUrl;
  const location = mode === "browse" ? company.allLocations : company.location;
  const description = mode === "search" ? company.whyRelevant : company.longDescription;

  const handleClick = async () => {
    if (mode === "search") {
      setDetailOpen(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);
    try {
      const data = await apiGet<BrowseCompanyDetail>(`/startups/${company.id}`);
      setBrowseDetail(data);
    } catch (error) {
      console.error("Failed to fetch company details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.div
        variants={cardEntrance}
        onClick={handleClick}
        className="relative rounded-xl border border-border-highlight bg-background-tertiary p-4 space-y-2.5 cursor-pointer transition-colors duration-200 hover:border-border-hover hover:bg-background-secondary h-full"
      >
        {/* Action buttons: top-right */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5">
          {mode === "search" && <ConnectButton companyId={company.id} />}
          <SaveButton companyId={company.id} size="sm" />
        </div>

        {/* Header: Logo + Name + Batch */}
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="flex items-center gap-2.5 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={company.name}
                className="h-8 w-8 shrink-0 rounded-md object-contain bg-white/5"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-elevated border border-border">
                <Building2 className="h-4 w-4 text-foreground-muted" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-semibold text-sm truncate text-foreground">
                {company.name}
              </h4>
              <p className="text-xs text-foreground-muted truncate mt-0.5">
                {company.oneLiner}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 rounded-full bg-highlight/10 border border-highlight/20 px-2 py-0.5">
            <ExternalLink className="h-3 w-3 text-highlight" />
            <span className="text-[10px] font-medium text-highlight">
              {company.batch}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-foreground-muted leading-relaxed line-clamp-3">
          {description}
        </p>

        {/* Divider */}
        <div className="h-px bg-divider" />

        {/* Footer: industries + metadata */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {company.industries.slice(0, 2).map((industry) => (
              <span
                key={industry}
                className="rounded-md bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-foreground-muted border border-border"
              >
                {industry}
              </span>
            ))}
            {company.industries.length > 2 && (
              <span className="text-[10px] text-foreground-muted/50 self-center">
                +{company.industries.length - 2}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {mode === "browse" && company.teamSize > 0 && (
              <div className="flex items-center gap-1 text-foreground-muted/60">
                <Users className="h-3 w-3" />
                <span className="text-[11px]">{company.teamSize}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-foreground-muted/60">
              <MapPin className="h-3 w-3" />
              <span className="text-[11px] truncate max-w-[80px]">{location}</span>
            </div>
          </div>
        </div>

        {/* Status badges (browse mode only) */}
        {mode === "browse" && (company.status === "Active" || company.stage) && (
          <div className="flex items-center gap-1.5">
            {company.status === "Active" && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-400"
              >
                {t("statusActive")}
              </Badge>
            )}
            {company.stage && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-border text-foreground-muted"
              >
                {company.stage}
              </Badge>
            )}
          </div>
        )}
      </motion.div>

      {/* Detail dialogs */}
      {mode === "search" && (
        <StartupDetailDialog
          card={company}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
      {mode === "browse" && browseDetail && (
        <CompanyDetailDialog
          company={browseDetail}
          open={!!browseDetail}
          onOpenChange={(open) => {
            if (!open) setBrowseDetail(null);
          }}
        />
      )}
    </>
  );
}
