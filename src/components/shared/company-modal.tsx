"use client";

import {
  MapPin,
  ExternalLink,
  Sparkles,
  Tag,
  Users,
  Globe,
  Briefcase,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { SaveButton } from "@/components/saved/save-button";
import { ConnectButton } from "@/components/connections/connect-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Unified company data type
interface CompanyModalData {
  id: number;
  name: string;
  oneLiner: string;
  batch: string;
  industries: string[];
  tags: string[];
  website: string;
  ycUrl: string;
  location: string;
  // Optional fields for browse mode
  smallLogoUrl?: string;
  longDescription?: string;
  teamSize?: number;
  industry?: string;
  subindustry?: string;
  regions?: string[];
  status?: string;
  stage?: string;
  topCompany?: boolean;
  isHiring?: boolean;
  // Optional field for search results
  whyRelevant?: string;
}

interface CompanyModalProps {
  company: CompanyModalData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "search" | "browse"; // Determines which sections to show
}

export function CompanyModal({
  company,
  open,
  onOpenChange,
  mode = "search",
}: CompanyModalProps) {
  const t = useTranslations("Browse");
  const isBrowseMode = mode === "browse";
  const hasExtendedData = isBrowseMode && company.longDescription;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`bg-background-secondary border-border-prominent ${
          hasExtendedData ? "max-w-2xl max-h-[85vh] overflow-y-auto" : ""
        }`}
      >
        <DialogHeader className="pr-8">
          <div className="flex items-start gap-3">
            {/* Logo (only in browse mode) */}
            {isBrowseMode && company.smallLogoUrl && (
              <img
                src={company.smallLogoUrl}
                alt={company.name}
                className="h-12 w-12 shrink-0 rounded-lg object-contain bg-white/5 border border-border"
              />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              {/* Title row with action buttons */}
              <div className="flex items-center gap-2">
                <DialogTitle className="font-heading text-lg text-foreground">
                  {company.name}
                </DialogTitle>
                <SaveButton companyId={company.id} size="sm" />
              </div>

              {/* Connect button */}
              {!isBrowseMode && (
                <ConnectButton companyId={company.id} variant="full" />
              )}

              {/* Description and Badge row */}
              <div className="flex items-start justify-between gap-3">
                <DialogDescription className="text-sm text-foreground-muted flex-1">
                  {company.oneLiner}
                </DialogDescription>
                <div className="flex items-center gap-1 shrink-0 rounded-full bg-highlight/10 border border-highlight/20 px-2.5 py-1">
                  <ExternalLink className="h-3.5 w-3.5 text-highlight" />
                  <span className="text-xs font-medium text-highlight">
                    {company.batch}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status badges (only in browse mode) */}
          {isBrowseMode && (company.status || company.stage || company.topCompany || company.isHiring) && (
            <div className="flex items-center gap-2 mt-3">
              {company.status === "Active" && (
                <Badge variant="outline" className="border-green-500/30 text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  {t("statusActive")}
                </Badge>
              )}
              {company.status && company.status !== "Active" && (
                <Badge variant="outline" className="border-border text-foreground-muted">
                  {company.status}
                </Badge>
              )}
              {company.stage && (
                <Badge variant="outline" className="border-border text-foreground-muted">
                  <TrendingUp className="h-3 w-3" />
                  {company.stage}
                </Badge>
              )}
              {company.topCompany && (
                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                  Top Company
                </Badge>
              )}
              {company.isHiring && (
                <Badge className="bg-highlight/15 text-highlight border-highlight/30">
                  Contratando
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        {/* Why Relevant (only in search mode) */}
        {!isBrowseMode && company.whyRelevant && (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-highlight" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Por que é relevante
                </h4>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 rounded-lg bg-highlight/5 border border-highlight/10 p-3">
                {company.whyRelevant}
              </p>
            </div>
            <Separator className="bg-divider" />
          </>
        )}

        {/* Long Description (only in browse mode) */}
        {isBrowseMode && company.longDescription && (
          <>
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {t("about")}
              </h4>
              <p className="text-sm leading-relaxed text-foreground/90">
                {company.longDescription}
              </p>
            </div>
            <Separator className="bg-divider" />
          </>
        )}

        {/* Metadata grid (only in browse mode with extended data) */}
        {isBrowseMode && (company.teamSize || company.industry || company.regions) && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Location */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-foreground-muted" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    {t("location")}
                  </h3>
                </div>
                <p className="text-sm text-foreground/90">{company.location}</p>
              </div>

              {/* Team Size */}
              {company.teamSize && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-foreground-muted" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                      {t("team")}
                    </h3>
                  </div>
                  <p className="text-sm text-foreground/90">
                    {t("memberCount", { count: company.teamSize })}
                  </p>
                </div>
              )}

              {/* Industry */}
              {company.industry && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-foreground-muted" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                      {t("industry")}
                    </h3>
                  </div>
                  <p className="text-sm text-foreground/90">
                    {company.industry}
                    {company.subindustry && ` / ${company.subindustry}`}
                  </p>
                </div>
              )}

              {/* Regions */}
              {company.regions && company.regions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-foreground-muted" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                      {t("regions")}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {company.regions.map((r) => (
                      <Badge key={r} variant="outline" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Separator className="bg-divider" />
          </>
        )}

        {/* Industries */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Industrias
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {company.industries.map((industry) => (
              <span
                key={industry}
                className="rounded-md bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground-muted border border-border"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>

        {/* Tags */}
        {company.tags.length > 0 && (
          <>
            <Separator className="bg-divider" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-foreground-muted" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Tags
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {company.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground-muted border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator className="bg-divider" />

        {/* Footer: Location (search mode) or Links */}
        {!isBrowseMode ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-foreground-muted">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm">{company.location}</span>
            </div>
            <div className="flex items-center gap-3">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-highlight hover:underline"
                >
                  Website
                </a>
              )}
              {company.ycUrl && (
                <a
                  href={company.ycUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-highlight hover:underline"
                >
                  YC Profile
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-highlight hover:underline"
              >
                Website
              </a>
            )}
            {company.ycUrl && (
              <a
                href={company.ycUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-highlight hover:underline"
              >
                YC Profile
              </a>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
