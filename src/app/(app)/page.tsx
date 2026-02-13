"use client";

import { useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, PanelRightOpen, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PanelImperativeHandle } from "react-resizable-panels";
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
  } = useAgentPanelStore();
  const user = useAuthStore((s) => s.user);
  const agentPanelRef = useRef<PanelImperativeHandle>(null);
  const isAnimatingRef = useRef(false);
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
        isAnimatingRef.current = true;
        panel.expand();
        setTimeout(() => { isAnimatingRef.current = false; }, 350);
      } else if (!panelOpen && !panel.isCollapsed()) {
        isAnimatingRef.current = true;
        panel.collapse();
        setTimeout(() => { isAnimatingRef.current = false; }, 350);
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

  const isIdle = discoveryState === "idle";
  const isLoggedIn = !!user;
  const showPanel = panelOpen || analysisStatus !== "idle" || scoutStatus !== "idle";

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
                <div className="relative flex items-center justify-center border-b border-border px-4 py-2">
                  <StageIndicator currentStage={currentStage} />
                  {showPanel && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 h-7 w-7 text-foreground-muted transition-colors hover:text-foreground"
                      onClick={() => setPanelOpen(!panelOpen)}
                      aria-label={panelOpen ? "Fechar painel" : "Abrir painel"}
                    >
                      {panelOpen ? (
                        <PanelRightClose className="h-4 w-4" />
                      ) : (
                        <PanelRightOpen className="h-4 w-4" />
                      )}
                    </Button>
                  )}
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
                    if (isAnimatingRef.current) return;
                    const collapsed = size.asPercentage === 0;
                    if (collapsed && panelOpen) setPanelOpen(false);
                    if (!collapsed && !panelOpen) setPanelOpen(true);
                  }}
                >
                  <AgentWorkPanel onConfirm={confirmPlan} />
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
