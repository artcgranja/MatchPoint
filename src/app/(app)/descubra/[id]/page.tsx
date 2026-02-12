"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Users,
  Globe,
  Tag,
  Briefcase,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { fadeIn } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { BrowseCompanyDetail } from "@/types";

export default function DescubraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<BrowseCompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCompany() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet<BrowseCompanyDetail>(`/startups/${id}`);
        if (!cancelled) setCompany(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Erro ao carregar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCompany();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-foreground-muted">
          {error ?? "Startup nao encontrada"}
        </p>
        <Link
          href="/descubra"
          className="text-sm text-highlight hover:underline"
        >
          Voltar para Descubra
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
      {/* Back link */}
      <Link
        href="/descubra"
        className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Descubra
      </Link>

      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          {company.smallLogoUrl && (
            <img
              src={company.smallLogoUrl}
              alt={company.name}
              className="h-14 w-14 shrink-0 rounded-lg object-contain bg-white/5 border border-border"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold font-heading text-foreground">
                  {company.name}
                </h1>
                <p className="mt-1 text-sm text-foreground-muted">
                  {company.oneLiner}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 rounded-full bg-highlight/10 border border-highlight/20 px-2.5 py-1">
                <ExternalLink className="h-3.5 w-3.5 text-highlight" />
                <span className="text-xs font-medium text-highlight">
                  {company.batch}
                </span>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 mt-3">
              {company.status === "Active" && (
                <Badge
                  variant="outline"
                  className="border-green-500/30 text-green-400"
                >
                  <CheckCircle className="h-3 w-3" />
                  Ativa
                </Badge>
              )}
              {company.status !== "Active" && (
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
          </div>
        </div>

        <Separator className="bg-divider" />

        {/* Description */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
            Sobre
          </h2>
          <p className="text-sm leading-relaxed text-foreground/90">
            {company.longDescription}
          </p>
        </div>

        <Separator className="bg-divider" />

        {/* Metadata grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Location */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-foreground-muted" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Localizacao
              </h3>
            </div>
            <p className="text-sm text-foreground/90">
              {company.allLocations}
            </p>
          </div>

          {/* Team Size */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-foreground-muted" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Equipe
              </h3>
            </div>
            <p className="text-sm text-foreground/90">
              {company.teamSize} {company.teamSize === 1 ? "membro" : "membros"}
            </p>
          </div>

          {/* Industry */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-foreground-muted" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Industria
              </h3>
            </div>
            <p className="text-sm text-foreground/90">
              {company.industry}
              {company.subindustry && ` / ${company.subindustry}`}
            </p>
          </div>

          {/* Regions */}
          {company.regions.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-foreground-muted" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Regioes
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

        {/* Industries */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
            Industrias
          </h2>
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
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-foreground-muted" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
                  Tags
                </h2>
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

        {/* Links */}
        <div className="flex items-center gap-4">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-highlight hover:underline"
            >
              <Globe className="h-4 w-4" />
              Website
            </a>
          )}
          {company.ycUrl && (
            <a
              href={company.ycUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-highlight hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              YC Profile
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}
