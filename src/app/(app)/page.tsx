"use client";

import { useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RotateCcw, Brain, Rocket, Loader2 } from "lucide-react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { HeroChatSection } from "@/components/home/hero-chat-section";
import { ChatWelcome } from "@/components/search/chat-welcome";
import { ChatMessageList } from "@/components/discovery/chat-message-list";
import { ChatInput } from "@/components/discovery/chat-input";
import { StageIndicator } from "@/components/discovery/phase-indicator";
import { AgentWorkPanel } from "@/components/agent-panel/agent-work-panel";
import { useDiscoverySession } from "@/hooks/use-discovery-session";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { useAuthStore } from "@/stores/auth-store";
import { useLoginModalStore } from "@/stores/login-modal-store";
import { useSessions } from "@/hooks/use-sessions";
import { toast } from "sonner";
import { EASE_OUT_EXPO } from "@/lib/motion";

export default function HomePage() {
  const {
    sessionId,
    discoveryState,
    currentStage,
    messages,
    isStreaming,
    isLoadingSession,
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
  const user = useAuthStore((s) => s.user);
  const agentPanelRef = useRef<PanelImperativeHandle>(null);
  const {
    sessions,
    currentSessionId: hookSessionId,
    handleSelect: handleSessionSelect,
    deleteSession,
  } = useSessions();

  useEffect(() => {
    if (sessionId && discoveryState === "idle" && messages.length === 0) {
      loadSession(sessionId).catch(() => {
        toast.error("Sessão não encontrada");
        reset();
      });
    }
    // Re-run when sessionId changes (e.g. selecting a session from sidebar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

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
      if (!user) {
        useLoginModalStore.getState().openLoginModal();
        return;
      }
      if (!sessionId) {
        const newId = await initSession();
        await sendMessage(text, newId);
      } else {
        await sendMessage(text);
      }
    },
    [user, sessionId, initSession, sendMessage]
  );

  const handleNewDiscovery = useCallback(() => {
    reset();
  }, [reset]);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
  }, [setPanelOpen]);

  const isIdle = discoveryState === "idle";
  const isLoggedIn = !!user;
  const showPanel = panelOpen || analysisStatus !== "idle" || scoutStatus !== "idle";
  const showPanelToggle = !panelOpen && (analysisStatus !== "idle" || scoutStatus !== "idle");

  const toggleLabel = scoutStatus !== "idle" && cards.length > 0
    ? `Resultados (${cards.length})`
    : analysisStatus !== "idle"
      ? "Análise"
      : "Painel";

  const ToggleIcon = scoutStatus !== "idle" && cards.length > 0 ? Rocket : Brain;

  return (
  <>
    <AnimatePresence mode="wait" initial={false}>
      {isIdle ? (
        isLoadingSession ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-full flex-col items-center justify-center gap-3"
          >
            <Loader2 className="h-6 w-6 animate-spin text-highlight" />
            <p className="text-sm text-foreground-muted">Carregando chat...</p>
          </motion.div>
        ) : isLoggedIn ? (
          <motion.div
            key="welcome"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="flex h-full flex-col"
          >
            <ChatWelcome
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              currentStage={currentStage}
              sessions={sessions}
              currentSessionId={hookSessionId}
              onSelectSession={handleSessionSelect}
              onDeleteSession={deleteSession}
            />
          </motion.div>
        ) : (
          <motion.div
            key="hero"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="h-full overflow-y-auto"
          >
            <HeroChatSection
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              currentStage={currentStage}
            />
          </motion.div>
        )
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="h-full"
        >
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Chat panel */}
            <ResizablePanel defaultSize={65} minSize={40}>
              <div className="flex h-full flex-col">
                {/* Header */}
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

                {/* Messages + input */}
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
              </div>
            </ResizablePanel>

            {/* Resize handle + Agent Work Panel */}
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
        </motion.div>
      )}
    </AnimatePresence>

  </>
  );
}
