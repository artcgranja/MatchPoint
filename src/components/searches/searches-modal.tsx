"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FolderOpen, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSearchesModalStore } from "@/stores/searches-modal-store";
import { apiGet } from "@/lib/api/client";
import { SearchCard } from "./search-card";
import type { SessionPipelineStage } from "@/types";

interface SearchItem {
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

export function SearchesModal() {
  const { open, closeModal } = useSearchesModalStore();
  const t = useTranslations("Searches");
  const router = useRouter();
  const [searches, setSearches] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      apiGet<{ data: SearchItem[] }>("/searches?limit=5")
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
            <FolderOpen className="h-5 w-5 text-highlight" />
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
              <FolderOpen className="h-10 w-10 text-foreground-muted/30" />
              <p className="text-sm text-foreground-muted">{t("noSearchesYet")}</p>
              <p className="text-xs text-foreground-muted/50">
                {t("startSearching")}
              </p>
            </div>
          ) : (
            searches.map((search) => <SearchCard key={search.id} search={search} />)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
