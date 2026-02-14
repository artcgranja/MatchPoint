"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { MessageSquare, FileText, Rocket, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cardStagger } from "@/lib/motion";
import { apiGet } from "@/lib/api/client";
import { SearchCard } from "@/components/searches/search-card";
import type { SessionPipelineStage } from "@/types";

const STAGE_TABS: { value: SessionPipelineStage | "all"; label: string; icon: typeof MessageSquare }[] = [
  { value: "all", label: "all", icon: FolderOpen },
  { value: "discovery", label: "discovery", icon: MessageSquare },
  { value: "analysis", label: "analysis", icon: FileText },
  { value: "results", label: "results", icon: Rocket },
];

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

export default function SearchesPage() {
  const t = useTranslations("Searches");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<SessionPipelineStage | "all">("all");
  const [data, setData] = useState<{ data: SearchItem[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stageParam = (searchParams.get("stage") || "all") as SessionPipelineStage | "all";
    setStage(stageParam);

    setLoading(true);
    const query = stageParam === "all" ? "" : `?stage=${stageParam}`;
    apiGet<{ data: SearchItem[]; total: number }>(`/searches${query}`)
      .then(setData)
      .catch((error) => {
        console.error("Failed to fetch searches:", error);
        setData({ data: [], total: 0 });
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleStageChange = (newStage: SessionPipelineStage | "all") => {
    setStage(newStage);
    const params = new URLSearchParams(searchParams);
    if (newStage === "all") {
      params.delete("stage");
    } else {
      params.set("stage", newStage);
    }
    const queryString = params.toString();
    router.push(`/searches${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-foreground-muted">{t("description")}</p>
      </div>

      {/* Stage filter tabs */}
      <div className="flex gap-2">
        {STAGE_TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <Button
              key={tab.value}
              variant={stage === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleStageChange(tab.value)}
            >
              <TabIcon className="h-4 w-4 mr-2" />
              {tab.value === "all" ? t("stages.all") :
               tab.value === "discovery" ? t("stages.discovery") :
               tab.value === "analysis" ? t("stages.analysis") :
               t("stages.results")}
            </Button>
          );
        })}
      </div>

      {/* Search cards grid */}
      {loading ? (
        <p className="text-center text-sm text-foreground-muted">
          {t("loading")}
        </p>
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
          <FolderOpen className="h-16 w-16 text-foreground-muted/30" />
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground">
              {t("noSearchesYet")}
            </h2>
            <p className="text-sm text-foreground-muted/50">
              {t("startSearching")}
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          variants={cardStagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {data.data.map((search) => (
            <SearchCard key={search.id} search={search} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
