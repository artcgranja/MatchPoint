"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Lightbulb, Search, TrendingUp } from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { cardStagger, cardEntrance } from "@/lib/motion";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { useAuthStore } from "@/stores/auth-store";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ProductInsight {
  id: string;
  name: string;
  definition: string;
  category: string;
  demandCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export default function ProductInsightsPage() {
  const t = useTranslations("ProductInsights");
  const user = useAuthStore((s) => s.user);
  const relativeTime = useRelativeTime();

  const [concepts, setConcepts] = useState<ProductInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchConcepts = useCallback(async () => {
    try {
      const data = await apiGet<ProductInsight[]>(
        "/builder/product-insights"
      );
      setConcepts(data);
    } catch {
      setConcepts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "builder") return;
    fetchConcepts();
  }, [user, fetchConcepts]);

  const filtered = search
    ? concepts.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.category.toLowerCase().includes(search.toLowerCase())
      )
    : concepts;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-highlight border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <SectionHeader title={t("title")} description={t("description")} />

      {concepts.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={t("empty")}
          description={t("emptyHint")}
        />
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>

          <motion.div
            variants={cardStagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((concept) => (
              <motion.div
                key={concept.id}
                variants={cardEntrance}
                className="glass flex flex-col gap-3 rounded-xl p-4 transition-colors hover:border-highlight/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-tight">
                    {concept.name}
                  </h3>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {concept.category}
                  </Badge>
                </div>

                <p className="line-clamp-2 text-xs text-foreground-muted">
                  {concept.definition}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-1.5 text-highlight">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-sm font-bold">
                      {t("demandCount", { count: concept.demandCount })}
                    </span>
                  </div>
                  <span className="text-[10px] text-foreground-muted">
                    {relativeTime(concept.lastSeenAt)}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && search && (
            <p className="py-8 text-center text-sm text-foreground-muted">
              No concepts match &quot;{search}&quot;
            </p>
          )}
        </>
      )}
    </div>
  );
}
