"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LayoutGrid, ArrowRight } from "lucide-react";
import { useSessionNavigation } from "@/hooks/use-session-navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/discovery/session-card";
import { useSearchesModalStore } from "@/stores/searches-modal-store";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { apiGet } from "@/lib/api/client";
import type { SessionItem, SessionPipelineStage } from "@/types";

interface SearchApiItem {
  id: string;
  discoverySessionId: string | null;
  sessionTitle: string;
  stage: SessionPipelineStage;
  resultCount: number;
  preview: string | null;
  topStartups: string[] | null;
  createdAt: string;
  updatedAt: string;
}

function toSessionItem(search: SearchApiItem): SessionItem {
  const isResults = search.stage === "results";
  const isAnalysis = search.stage === "analysis";
  return {
    id: search.discoverySessionId ?? search.id,
    title: search.sessionTitle,
    pipelineStage: search.stage,
    isComplete: isResults || isAnalysis,
    hasResults: isResults,
    resultCount: search.resultCount,
    searchExecutionId: search.id,
    preview: !isAnalysis ? search.preview : null,
    topStartups: search.topStartups,
    analysisPreview: isAnalysis ? search.preview : null,
    createdAt: search.createdAt,
    updatedAt: search.updatedAt,
  };
}

export function SearchesModal() {
  const { open, closeModal } = useSearchesModalStore();
  const t = useTranslations("Searches");
  const router = useRouter();
  const { goToSession } = useSessionNavigation();
  const getRelativeTime = useRelativeTime();
  const [searches, setSearches] = useState<SearchApiItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelectSearch = (discoverySessionId: string | null) => {
    if (!discoverySessionId) return;
    closeModal();
    goToSession(discoverySessionId);
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      apiGet<{ data: SearchApiItem[] }>("/searches?limit=5")
        .then((response) => setSearches(response.data))
        .catch((error) => {
          console.error("Failed to fetch searches:", error);
          setSearches([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-highlight" />
            {t("recentSearches")}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              closeModal();
              router.push("/searches");
            }}
          >
            {t("seeAll")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="grid gap-3">
          {loading ? (
            <p className="text-center text-sm text-foreground-muted">
              {t("loading")}
            </p>
          ) : searches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <LayoutGrid className="h-10 w-10 text-foreground-muted/30" />
              <p className="text-sm text-foreground-muted">{t("noSearchesYet")}</p>
              <p className="text-xs text-foreground-muted/50">
                {t("startSearching")}
              </p>
            </div>
          ) : (
            searches.map((search) => {
              const session = toSessionItem(search);
              return (
                <SessionCard
                  key={search.id}
                  session={session}
                  onClick={() => handleSelectSearch(search.discoverySessionId)}
                  relativeTime={getRelativeTime(search.updatedAt)}
                />
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
