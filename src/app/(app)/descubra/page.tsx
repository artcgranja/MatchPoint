"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Compass, ChevronLeft, ChevronRight } from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { cardStagger } from "@/lib/motion";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StartupBrowseCard } from "@/components/descubra/startup-browse-card";
import { StartupFilters } from "@/components/descubra/startup-filters";
import type { BrowseCompany, PaginatedResponse } from "@/types";

const LIMIT = 12;

function DescubraContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page") ?? 1);

  const [data, setData] = useState<PaginatedResponse<BrowseCompany> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const [filterOptions, setFilterOptions] = useState<{
    industries: string[];
    tags: string[];
    regions: string[];
  }>({ industries: [], tags: [], regions: [] });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        if (!params.has("page")) params.set("page", String(page));
        if (!params.has("limit")) params.set("limit", String(LIMIT));

        const result = await apiGet<PaginatedResponse<BrowseCompany>>(
          `/startups?${params.toString()}`
        );
        if (!cancelled) {
          setData(result);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [searchParams, page]);

  // Fetch filter options once
  useEffect(() => {
    async function fetchOptions() {
      try {
        const all = await apiGet<PaginatedResponse<BrowseCompany>>(
          "/startups?limit=100"
        );
        const industries = new Set<string>();
        const tags = new Set<string>();
        const regions = new Set<string>();
        for (const c of all.data) {
          c.industries.forEach((i) => industries.add(i));
          c.tags.forEach((t) => tags.add(t));
        }
        setFilterOptions({
          industries: [...industries].sort(),
          tags: [...tags].sort(),
          regions: [...regions].sort(),
        });
      } catch {
        // ignore
      }
    }
    fetchOptions();
  }, []);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/descubra?${params.toString()}`);
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
          {data.total} {data.total === 1 ? "startup encontrada" : "startups encontradas"}
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
          icon={Compass}
          title="Nenhuma startup encontrada"
          description="Tente ajustar os filtros ou buscar por outro termo."
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
            <StartupBrowseCard key={company.id} company={company} />
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
            {page} de {totalPages}
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

function DescubraFallback() {
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

export default function DescubraPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      <SectionHeader
        title="Descubra"
        description="Explore startups e encontre parceiros ideais para o seu negocio."
      />
      <Suspense fallback={<DescubraFallback />}>
        <DescubraContent />
      </Suspense>
    </div>
  );
}
