"use client";

import { useEffect, useCallback } from "react";
import { Compass, Sparkles, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { SuggestionChips } from "@/components/search/suggestion-chips";
import { ChatMessageList } from "@/components/discovery/chat-message-list";
import { ChatInput } from "@/components/discovery/chat-input";
import { StageIndicator } from "@/components/discovery/phase-indicator";
import { useDiscoverySession } from "@/hooks/use-discovery-session";
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
    reset,
  } = useDiscoverySession();

  useEffect(() => {
    if (sessionId && discoveryState === "idle" && messages.length === 0) {
      loadSession(sessionId).catch(() => {
        reset();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const isIdle = discoveryState === "idle";

  return (
    <div className="flex h-full flex-col">
      {/* Header — only when active */}
      {!isIdle && (
        <div className="mb-4 flex items-center justify-between">
          <StageIndicator currentStage={currentStage} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewDiscovery}
            className="shrink-0 gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Nova Busca
          </Button>
        </div>
      )}

      {/* Main area */}
      {isIdle ? (
        /* ── Idle: welcome + suggestions + input ── */
        <div className="flex flex-1 flex-col">
          {/* Centered welcome content */}
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

            {/* Suggestion cards */}
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

          {/* Input pinned at bottom */}
          <div className="mx-auto w-full max-w-2xl pb-2 pt-4">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isStreaming}
              currentStage={currentStage}
            />
          </div>
        </div>
      ) : (
        /* ── Active: chat + input ── */
        <div className="glass flex min-h-0 flex-1 flex-col rounded-xl p-4">
          <ChatMessageList messages={messages} isStreaming={isStreaming} />
          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming}
            currentStage={currentStage}
          />
        </div>
      )}
    </div>
  );
}
