"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { motion } from "motion/react";
import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/lib/api/client";
import { cardStagger } from "@/lib/motion";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/components/shared/company-card";
import { StartupFilters } from "@/components/descubra/startup-filters";
import { useAuthStore } from "@/stores/auth-store";
import { useLoginModalStore } from "@/stores/login-modal-store";
import { Link } from "@/i18n/navigation";
import type { BrowseCompany, PaginatedResponse } from "@/types";

const LIMIT = 12;

function SalvosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("Saved");
  const tBrowse = useTranslations("Browse");
  const user = useAuthStore((s) => s.user);

  const page = Number(searchParams.get("page") ?? 1);

  const [data, setData] = useState<PaginatedResponse<BrowseCompany> | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterOptions, setFilterOptions] = useState<{
    industries: string[];
    tags: string[];
    regions: string[];
  }>({ industries: [], tags: [], regions: [] });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setData(null);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        if (!params.has("page")) params.set("page", String(page));
        if (!params.has("limit")) params.set("limit", String(LIMIT));

        const result = await apiGet<PaginatedResponse<BrowseCompany>>(
          `/saved-startups?${params.toString()}`
        );
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [searchParams, page, user]);

  // Build filter options from first page of results
  useEffect(() => {
    if (!user || !data) return;
    const industries = new Set<string>();
    const tags = new Set<string>();
    for (const c of data.data) {
      c.industries.forEach((i) => industries.add(i));
      c.tags.forEach((t) => tags.add(t));
    }
    setFilterOptions({
      industries: [...industries].sort(),
      tags: [...tags].sort(),
      regions: [],
    });
  }, [user, data]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Bookmark className="h-12 w-12 text-foreground-muted/30" />
        <p className="text-foreground-muted">{t("loginToSave")}</p>
        <Button onClick={() => useLoginModalStore.getState().openLoginModal()}>
          {t("loginButton")}
        </Button>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/salvos?${params.toString()}`);
  };

  return (
    <>
      <StartupFilters
        availableIndustries={filterOptions.industries}
        availableTags={filterOptions.tags}
        availableRegions={filterOptions.regions}
      />

      {data && !loading && (
        <p className="text-sm text-foreground-muted">
          {tBrowse("startupsFound", { count: data.total })}
        </p>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && data && data.data.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title={t("noSavedStartups")}
          description={t("noSavedHint")}
          action={
            <Button asChild variant="outline">
              <Link href="/descubra">{t("startExploring")}</Link>
            </Button>
          }
        />
      )}

      {!loading && data && data.data.length > 0 && (
        <motion.div
          variants={cardStagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {data.data.map((company) => (
            <CompanyCard key={company.id} mode="browse" company={company} />
          ))}
        </motion.div>
      )}

      {!loading && data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-foreground-muted px-3">
            {tBrowse("pageOf", { page, totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}

function SalvosFallback() {
  return (
    <>
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </>
  );
}

export default function SalvosPage() {
  const t = useTranslations("Saved");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      <SectionHeader
        title={t("title")}
        description={t("description")}
      />
      <Suspense fallback={<SalvosFallback />}>
        <SalvosContent />
      </Suspense>
    </div>
  );
}
