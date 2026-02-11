"use client";

import { useEffect, useCallback, useRef } from "react";
import { Compass, Sparkles, RotateCcw, Brain, Rocket } from "lucide-react";
import { motion } from "motion/react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { SuggestionChips } from "@/components/search/suggestion-chips";
import { ChatMessageList } from "@/components/discovery/chat-message-list";
import { ChatInput } from "@/components/discovery/chat-input";
import { StageIndicator } from "@/components/discovery/phase-indicator";
import { AgentWorkPanel } from "@/components/agent-panel/agent-work-panel";
import { useDiscoverySession } from "@/hooks/use-discovery-session";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { fadeIn, slideUp } from "@/lib/motion";

export default function SearchPage() {
  const {
    sessionId,
    discoveryState,
    currentStage,
    messages,
    isStreaming,
    initSession,
    loadSession,
    sendMessage,
    confirmPlan,
    reset,
  } = useDiscoverySession();

  const {
    panelOpen,
    setPanelOpen,
    analysisStatus,
    scoutStatus,
    cards,
  } = useAgentPanelStore();
  const agentPanelRef = useRef<PanelImperativeHandle>(null);

  useEffect(() => {
    if (sessionId && discoveryState === "idle" && messages.length === 0) {
      loadSession(sessionId).catch(() => {
        reset();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync panel collapse/expand with store
  useEffect(() => {
    const panel = agentPanelRef.current;
    if (!panel) return;

    try {
      if (panelOpen && panel.isCollapsed()) {
        panel.expand();
      } else if (!panelOpen && !panel.isCollapsed()) {
        panel.collapse();
      }
    } catch {
      // Panel not yet registered with group — ignore
    }
  }, [panelOpen]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!sessionId) {
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

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
  }, [setPanelOpen]);

  const isIdle = discoveryState === "idle";
  const showPanel = panelOpen || analysisStatus !== "idle" || scoutStatus !== "idle";
  const showPanelToggle = !panelOpen && (analysisStatus !== "idle" || scoutStatus !== "idle");

  // Determine toggle button label
  const toggleLabel = scoutStatus !== "idle" && cards.length > 0
    ? `Resultados (${cards.length})`
    : analysisStatus !== "idle"
      ? "Analise"
      : "Painel";

  const ToggleIcon = scoutStatus !== "idle" && cards.length > 0 ? Rocket : Brain;

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full"
    >
      {/* Chat panel */}
      <ResizablePanel defaultSize={65} minSize={40}>
        <div className="flex h-full flex-col">
          {/* Header — only when active */}
          {!isIdle && (
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <StageIndicator currentStage={currentStage} />
              <div className="flex items-center gap-2">
                {showPanelToggle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPanelOpen(true)}
                    className="gap-2 text-foreground-muted"
                  >
                    <ToggleIcon className="h-3.5 w-3.5" />
                    {toggleLabel}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewDiscovery}
                  className="gap-2 text-foreground-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Nova Busca
                </Button>
              </div>
            </div>
          )}

          {/* Main area */}
          {isIdle ? (
            /* Idle: welcome + suggestions + input */
            <div className="flex flex-1 flex-col">
              <div className="flex flex-1 flex-col items-center justify-center px-4">
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-highlight/10">
                    <Compass className="h-7 w-7 text-highlight" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold">
                    O que voce esta buscando?
                  </h2>
                  <p className="mt-2 max-w-lg text-center text-sm text-foreground-muted">
                    Descreva seu desafio e vou encontrar as startups mais relevantes
                    para sua empresa.
                  </p>
                </motion.div>

                <motion.div
                  variants={slideUp}
                  initial="hidden"
                  animate="visible"
                  className="mt-8 w-full max-w-2xl"
                >
                  <div className="mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-foreground-muted" />
                    <span className="text-xs font-medium text-foreground-muted">
                      Ou experimente um cenario
                    </span>
                  </div>
                  <SuggestionChips onSelect={handleChipSelect} />
                </motion.div>
              </div>

              <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={isStreaming}
                  currentStage={currentStage}
                />
              </div>
            </div>
          ) : (
            /* Active: messages + input */
            <div className="flex min-h-0 flex-1 flex-col">
              <ChatMessageList messages={messages} isStreaming={isStreaming} />
              <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={isStreaming}
                  currentStage={currentStage}
                />
              </div>
            </div>
          )}
        </div>
      </ResizablePanel>

      {/* Resize handle + Agent Work Panel — only when relevant */}
      {showPanel && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            panelRef={agentPanelRef}
            defaultSize={35}
            minSize={15}
            collapsible
            collapsedSize={0}
            onResize={(size) => {
              const collapsed = size.asPercentage === 0;
              if (collapsed && panelOpen) setPanelOpen(false);
              if (!collapsed && !panelOpen) setPanelOpen(true);
            }}
          >
            <AgentWorkPanel
              onConfirm={confirmPlan}
              onClose={handleClosePanel}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
