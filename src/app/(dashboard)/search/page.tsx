"use client";

import { useEffect, useCallback } from "react";
import { Search, Compass, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeader } from "@/components/ui/section-header";
import { PainPointInput } from "@/components/search/pain-point-input";
import { SuggestionChips } from "@/components/search/suggestion-chips";
import { FilterPanel } from "@/components/search/filter-panel";
import { AgentPipelineVisualizer } from "@/components/search/agent-pipeline-visualizer";
import { ChatMessageList } from "@/components/discovery/chat-message-list";
import { ChatInput } from "@/components/discovery/chat-input";
import { PhaseIndicator } from "@/components/discovery/phase-indicator";
import { useSearchStore } from "@/stores/search-store";
import { useDiscoverySession } from "@/hooks/use-discovery-session";
import { apiGet, apiPost } from "@/lib/api/client";
import { fadeIn } from "@/lib/motion";
import type { DiscoverySession } from "@/types";

const USE_API = process.env.NEXT_PUBLIC_USE_API === "true";

function LegacySearchPage() {
  const { painPoint, filters, isSearching, startPipeline, setSearchId } =
    useSearchStore();

  const handleSearch = async () => {
    if (!painPoint.trim() || isSearching) return;

    startPipeline();

    try {
      const { id } = await apiPost<{ id: string }>("/searches", {
        painPoint,
        filters,
      });
      setSearchId(id);
    } catch (error) {
      console.error("Failed to create search:", error);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Discovery"
        description="Describe your business challenge and let our AI agents find the best startup matches."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <GlassCard>
            <PainPointInput />
            <div className="mt-4">
              <SuggestionChips />
            </div>
            <div className="mt-6">
              <Button
                onClick={handleSearch}
                disabled={!painPoint.trim() || isSearching}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "Searching..." : "Find Matches"}
              </Button>
            </div>
          </GlassCard>

          <AgentPipelineVisualizer />
        </div>

        <div>
          <GlassCard>
            <h3 className="text-sm font-semibold mb-4">Filters</h3>
            <FilterPanel />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function DiscoverySearchPage() {
  const {
    sessionId,
    discoveryState,
    currentPhase,
    messages,
    isComplete,
    isStreaming,
    initSession,
    loadSession,
    sendMessage,
    reset,
    setDiscoveryState,
  } = useDiscoverySession();

  const { startPipeline, setSearchId, pipelineStatus } = useSearchStore();

  // Restore session on mount if we have a persisted sessionId
  useEffect(() => {
    if (sessionId && discoveryState === "idle" && messages.length === 0) {
      loadSession(sessionId).catch(() => {
        // Session no longer exists in DB, reset
        reset();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When discovery completes, trigger search pipeline
  useEffect(() => {
    if (
      discoveryState === "completing" &&
      isComplete &&
      sessionId &&
      pipelineStatus === "idle"
    ) {
      const triggerSearch = async () => {
        try {
          setDiscoveryState("transitioning");

          // Fetch the session to get the bizPlan summary as painPoint
          const session = await apiGet<DiscoverySession>(
            `/discovery/${sessionId}`
          );
          const firstUserMsg =
            session.messages.find((m) => m.role === "user")?.content ??
            "Discovery-based search";

          const { id } = await apiPost<{ id: string }>("/searches", {
            painPoint: firstUserMsg,
            discoverySessionId: sessionId,
          });

          setSearchId(id);
          startPipeline();
        } catch (error) {
          console.error("Failed to create search from discovery:", error);
        }
      };

      triggerSearch();
    }
  }, [
    discoveryState,
    isComplete,
    sessionId,
    pipelineStatus,
    setDiscoveryState,
    setSearchId,
    startPipeline,
  ]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!sessionId) {
        // First message — create session then send
        const newId = await initSession();
        await sendMessage(text, newId);
      } else {
        await sendMessage(text);
      }
    },
    [sessionId, initSession, sendMessage]
  );

  const handleChipSelect = useCallback(
    (suggestion: string) => {
      handleSendMessage(suggestion);
    },
    [handleSendMessage]
  );

  const handleNewDiscovery = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Discovery"
        description="Converse com nosso Navigator para encontrar as melhores startups para o seu desafio."
        action={
          discoveryState !== "idle" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewDiscovery}
              className="gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Nova Busca
            </Button>
          ) : undefined
        }
      />

      {discoveryState !== "idle" && (
        <PhaseIndicator currentPhase={currentPhase} />
      )}

      <GlassCard className="flex flex-col" style={{ minHeight: "60vh" }}>
        {discoveryState === "idle" ? (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex flex-1 flex-col items-center justify-center gap-6 py-12"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-highlight/10">
              <Compass className="h-8 w-8 text-highlight" />
            </div>
            <div className="max-w-md text-center">
              <h3 className="text-lg font-semibold">
                Bem-vindo ao Discovery
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">
                Sou o Navigator, seu consultor de parcerias
                corporacao-startup. Vou entender profundamente seu desafio
                para encontrar as melhores solucoes. Comece descrevendo sua
                empresa ou escolha um dos cenarios abaixo.
              </p>
            </div>
            <div className="w-full max-w-2xl">
              <SuggestionChips onSelect={handleChipSelect} />
            </div>
          </motion.div>
        ) : discoveryState === "transitioning" ? (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex flex-1 flex-col items-center justify-center gap-4 py-12"
          >
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-highlight [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-highlight [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-highlight [animation-delay:300ms]" />
            </div>
            <p className="text-sm text-foreground-muted">
              Discovery concluida! Buscando matches com base no seu
              perfil...
            </p>
          </motion.div>
        ) : (
          <>
            <ChatMessageList messages={messages} isStreaming={isStreaming} />
            <ChatInput
              onSend={handleSendMessage}
              disabled={isStreaming}
              currentPhase={currentPhase}
            />
          </>
        )}
      </GlassCard>

      {discoveryState === "transitioning" && <AgentPipelineVisualizer />}
    </div>
  );
}

export default function SearchPage() {
  if (USE_API) {
    return <DiscoverySearchPage />;
  }
  return <LegacySearchPage />;
}
