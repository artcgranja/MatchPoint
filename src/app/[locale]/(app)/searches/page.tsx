"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { LayoutGrid, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionCard } from "@/components/discovery/session-card";
import { SessionActionDialogs } from "@/components/discovery/session-action-dialogs";
import { useSessionActions } from "@/hooks/use-session-actions";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { apiGet } from "@/lib/api/client";
import { STAGE_CONFIG } from "@/lib/stage-config";
import { cardStagger } from "@/lib/motion";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { useSearchStore } from "@/stores/search-store";
import type { SessionItem, SessionPipelineStage } from "@/types";

type StageFilter = SessionPipelineStage | "all";

const STAGE_FILTERS: { value: StageFilter; icon: typeof LayoutGrid }[] = [
  { value: "all", icon: LayoutGrid },
  { value: "discovery", icon: STAGE_CONFIG.discovery.icon },
  { value: "analysis", icon: STAGE_CONFIG.analysis.icon },
  { value: "results", icon: STAGE_CONFIG.results.icon },
];

export default function SearchesPage() {
  const t = useTranslations("Searches");
  const tHistory = useTranslations("ChatHistory");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const getRelativeTime = useRelativeTime();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<StageFilter>(
    (searchParams.get("stage") as StageFilter) || "all"
  );
  const [query, setQuery] = useState("");

  const handleDelete = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleRename = async (sessionId: string, newTitle: string) => {
    const res = await fetch(`/api/v1/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: data.title } : s))
      );
    }
  };

  const sessionActions = useSessionActions({
    onDelete: handleDelete,
    onRename: handleRename,
  });

  useEffect(() => {
    setLoading(true);
    apiGet<SessionItem[]>("/sessions")
      .then(setSessions)
      .catch((error) => {
        console.error("Failed to fetch sessions:", error);
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredSessions = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const byStage = stage === "all" ? sorted : sorted.filter((s) => s.pipelineStage === stage);
    if (!query.trim()) return byStage;
    const lower = query.toLowerCase();
    return byStage.filter((s) => s.title.toLowerCase().includes(lower));
  }, [sessions, stage, query]);

  const handleStageChange = (newStage: StageFilter) => {
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

  const handleSelectSession = (sessionId: string) => {
    useDiscoveryStore.getState().reset();
    useAgentPanelStore.getState().reset();
    useSearchStore.getState().resetPipeline();
    router.push(`/?session=${sessionId}`);
  };

  const getStageLabel = (value: StageFilter) => {
    if (value === "all") return t("stages.all");
    if (value === "discovery") return t("stages.discovery");
    if (value === "analysis") return t("stages.analysis");
    return t("stages.results");
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

      {/* Search and filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9 bg-background-secondary/50 border-border"
          />
        </div>
        <div className="flex gap-2">
          {STAGE_FILTERS.map((filter) => {
            const FilterIcon = filter.icon;
            return (
              <Button
                key={filter.value}
                variant={stage === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleStageChange(filter.value)}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                {getStageLabel(filter.value)}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
          <LayoutGrid className="h-16 w-16 text-foreground-muted/30" />
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
          key={stage}
          variants={cardStagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isActive={false}
              onClick={() => handleSelectSession(session.id)}
              onDelete={() => sessionActions.requestDelete(session)}
              onRename={() => sessionActions.requestRename(session)}
              deleteLabel={tCommon("delete")}
              renameLabel={tHistory("renameSession")}
              resultCountLabel={tHistory("resultCount", { count: session.resultCount })}
              relativeTime={getRelativeTime(session.updatedAt)}
              moreLabel={(count) => tHistory("moreStartups", { count })}
            />
          ))}
        </motion.div>
      )}

      <SessionActionDialogs actions={sessionActions} />
    </div>
  );
}
