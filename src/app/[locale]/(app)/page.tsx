"use client";

import { useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import {
  DiscoveryPanelGroup,
  DiscoveryPanel,
  DiscoveryHandle,
} from "@/components/ui/discovery-resizable";
import { HeroChatSection } from "@/components/home/hero-chat-section";
import { BuilderHomePage } from "@/components/builder/builder-home-page";
import { ChatWelcome } from "@/components/search/chat-welcome";
import { ChatMessageList } from "@/components/discovery/chat-message-list";
import { ChatInput } from "@/components/discovery/chat-input";
import { ChatNavbar } from "@/components/layout/chat-navbar";
import { AgentWorkPanel } from "@/components/agent-panel/agent-work-panel";
import { QuestionWizard } from "@/components/discovery/question-wizard";
import { useDiscoverySession } from "@/hooks/use-discovery-session";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { useAuth } from "@/components/providers/auth-provider";
import { useLoginModalStore } from "@/stores/login-modal-store";
import { useSessions } from "@/hooks/use-sessions";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EASE_OUT_EXPO } from "@/lib/motion";

export default function HomePage() {
  const t = useTranslations("Chat");
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
    retryAnalysis,
    retryScout,
    submitQuestionAnswers,
    reset,
  } = useDiscoverySession();

  const {
    panelOpen,
    setPanelOpen,
    analysisStatus,
    scoutStatus,
  } = useAgentPanelStore();
  const { user } = useAuth();
  const agentPanelRef = useRef<PanelImperativeHandle>(null);
  const isAnimatingRef = useRef(false);
  const sessionTitle = useDiscoveryStore((s) => s.sessionTitle);
  const {
    sessions,
    currentSessionId: hookSessionId,
    handleSelect: handleSessionSelect,
    renameSession,
    deleteSession,
  } = useSessions();
  const searchParams = useSearchParams();
  const router = useRouter();
  const processedSessionRef = useRef<string | null>(null);

  // Handle URL query parameter for session loading
  useEffect(() => {
    const sessionIdFromUrl = searchParams.get("session");
    if (sessionIdFromUrl && sessionIdFromUrl !== processedSessionRef.current) {
      processedSessionRef.current = sessionIdFromUrl;
      handleSessionSelect(sessionIdFromUrl);
      router.replace("/", { scroll: false });
    } else if (!sessionIdFromUrl) {
      processedSessionRef.current = null;
    }
  }, [searchParams, handleSessionSelect, router]);

  useEffect(() => {
    if (sessionId && discoveryState === "idle" && messages.length === 0) {
      loadSession(sessionId).catch(() => {
        toast.error(t("sessionNotFound"));
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

  const handleAction = useCallback(
    (actionType: string) => {
      if (actionType === "retry_analysis") {
        retryAnalysis();
      } else if (actionType === "retry_scout") {
        retryScout();
      }
    },
    [retryAnalysis, retryScout]
  );

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

  if (user?.role === "builder") return <BuilderHomePage />;

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
            <p className="text-sm text-foreground-muted">{t("loadingChat")}</p>
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
              onRenameSession={renameSession}
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
          <DiscoveryPanelGroup direction="horizontal" className="h-full">
            {/* Chat panel */}
            <DiscoveryPanel defaultSize={65} minSize={40}>
              <div className="flex h-full flex-col">
                {/* Header */}
                <ChatNavbar
                  sessionId={sessionId!}
                  sessionTitle={sessionTitle}
                  currentStage={currentStage}
                  showPanel={showPanel}
                  panelOpen={panelOpen}
                  onTogglePanel={() => setPanelOpen(!panelOpen)}
                  onRename={renameSession}
                />

                {/* Messages + input */}
                <div className="flex min-h-0 flex-1 flex-col">
                  <ChatMessageList messages={messages} isStreaming={isStreaming} onAction={handleAction} />
                  <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
                    <ChatInput
                      onSend={handleSendMessage}
                      disabled={isStreaming}
                      currentStage={currentStage}
                    />
                  </div>
                </div>
              </div>
            </DiscoveryPanel>

            {/* Resize handle + Agent Work Panel */}
            {showPanel && (
              <>
                <DiscoveryHandle withHandle />
                <DiscoveryPanel
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
                </DiscoveryPanel>
              </>
            )}
          </DiscoveryPanelGroup>
        </motion.div>
      )}
    </AnimatePresence>
    <QuestionWizard onSubmit={submitQuestionAnswers} />
  </>
  );
}
