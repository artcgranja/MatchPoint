"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import { ChatInput } from "@/components/discovery/chat-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SessionCard } from "@/components/discovery/session-card";
import { SessionActionDialogs } from "@/components/discovery/session-action-dialogs";
import { useAuth } from "@/components/providers/auth-provider";
import { useSessionActions } from "@/hooks/use-session-actions";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { cn } from "@/lib/utils";
import { slideUp, staggerContainer } from "@/lib/motion";
import { STAGE_CONFIG, STAGE_ORDER } from "@/lib/stage-config";
import type { SessionItem, SessionPipelineStage, SessionStage } from "@/types";

interface ChatWelcomeProps {
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  currentStage: SessionStage;
  sessions: SessionItem[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
  onRenameSession: (sessionId: string, newTitle: string) => Promise<string | null | void> | void;
}

export function ChatWelcome({
  onSendMessage,
  isStreaming,
  currentStage,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
}: ChatWelcomeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations("Welcome");
  const tHistory = useTranslations("ChatHistory");
  const tSearches = useTranslations("Searches");
  const tCommon = useTranslations("Common");
  const getRelativeTime = useRelativeTime();

  const sessionActions = useSessionActions({
    onDelete: onDeleteSession,
    onRename: onRenameSession,
  });

  const hasSessions = sessions.length > 0;

  const firstName = user?.name?.split(" ")[0] || "there";

  const stageLabels: Record<SessionPipelineStage, string> = {
    discovery: tHistory("discovery"),
    analysis: tHistory("analysis"),
    results: tHistory("results"),
  };

  const groupedSessions = useMemo(() => {
    const groups: Record<SessionPipelineStage, SessionItem[]> = {
      discovery: [],
      analysis: [],
      results: [],
    };
    for (const s of sessions) {
      groups[s.pipelineStage]?.push(s);
    }
    for (const stage of Object.keys(groups) as SessionPipelineStage[]) {
      groups[stage].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
    return groups;
  }, [sessions]);

  const countByStage = (stage: SessionPipelineStage) =>
    groupedSessions[stage].length;

  const sessionsByStage = (stage: SessionPipelineStage) =>
    groupedSessions[stage].slice(0, 3);

  return (
    <div
      className="relative flex-1 overflow-y-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="pointer-events-none sticky top-0 z-0 -mb-[100vh] h-screen w-full">
        {!prefersReducedMotion && (
          <div
            className="h-screen w-full"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, transparent 38%, rgba(0,0,0,0.08) 48%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.5) 63%, rgba(0,0,0,0.75) 72%, black 82%, black 100%), radial-gradient(ellipse 130% 55% at 50% 100%, black 0%, black 75%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, transparent 38%, rgba(0,0,0,0.08) 48%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.5) 63%, rgba(0,0,0,0.75) 72%, black 82%, black 100%), radial-gradient(ellipse 130% 55% at 50% 100%, black 0%, black 75%, transparent 100%)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          >
            <AnimatedGradientBackground
              Breathing={isHovered}
              startingGap={120}
              breathingRange={8}
              animationSpeed={0.03}
              topOffset={10}
            />
          </div>
        )}
      </div>

      <div
        className={cn(
          "relative z-10 flex flex-col items-center justify-center",
          hasSessions ? "min-h-[85vh]" : "min-h-full"
        )}
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex w-full max-w-2xl flex-col items-center px-6"
        >
          <motion.h1
            variants={slideUp}
            className="mb-8 text-center font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {t("title", { name: firstName })}
          </motion.h1>

          <motion.div variants={slideUp} className="w-full">
            <ChatInput
              onSend={onSendMessage}
              disabled={isStreaming}
              currentStage={currentStage}
              variant="hero"
            />
          </motion.div>
        </motion.div>
      </div>

      {hasSessions && (
        <div className="relative z-10 flex justify-center px-4 pb-8">
          <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-2xl backdrop-blur-xl">
            <Tabs defaultValue="results" className="flex flex-col">
              <div className="border-b border-border/40 px-6 pt-5 pb-3">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">
                    {t("yourChats")}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/searches")}
                  >
                    {tSearches("seeAll")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <TabsList className="w-full">
                  {STAGE_ORDER.map((stage) => {
                    const config = STAGE_CONFIG[stage];
                    const count = countByStage(stage);
                    return (
                      <TabsTrigger key={stage} value={stage} className="flex-1 gap-2">
                        <config.icon className={cn("h-3.5 w-3.5", config.color)} />
                        {stageLabels[stage]}
                        {count > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-1 h-5 min-w-5 px-1.5 text-[10px]"
                          >
                            {count}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              <div className="py-4">
                {STAGE_ORDER.map((stage) => (
                  <TabsContent key={stage} value={stage} className="mt-0">
                    <ScrollArea className="max-h-[60vh]">
                      <div className="px-6">
                        {sessionsByStage(stage).length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-sm text-foreground-muted/50">
                              {t("noChatsInStage")}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {sessionsByStage(stage).map((session) => (
                              <SessionCard
                                key={session.id}
                                session={session}
                                isActive={session.id === currentSessionId}
                                onClick={() => onSelectSession(session.id)}
                                onDelete={() => sessionActions.requestDelete(session)}
                                onRename={() => sessionActions.requestRename(session)}
                                deleteLabel={tCommon("delete")}
                                renameLabel={tHistory("renameSession")}
                                resultCountLabel={tHistory("resultCount", { count: session.resultCount })}
                                relativeTime={getRelativeTime(session.updatedAt)}
                                moreLabel={(count) => tHistory("moreStartups", { count })}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </div>
      )}

      <SessionActionDialogs actions={sessionActions} />
    </div>
  );
}
