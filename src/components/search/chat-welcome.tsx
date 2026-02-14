"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  MessageSquare,
  FileText,
  Rocket,
} from "lucide-react";
import { useTranslations } from "next-intl";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import { ChatInput } from "@/components/discovery/chat-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SessionCard } from "@/components/discovery/session-card";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { slideUp, staggerContainer } from "@/lib/motion";
import type { SessionItem, SessionPipelineStage, SessionStage } from "@/types";

const STAGE_ICONS: Record<SessionPipelineStage, { icon: typeof MessageSquare; color: string }> = {
  discovery: { icon: MessageSquare, color: "text-blue-400" },
  analysis: { icon: FileText, color: "text-amber-400" },
  results: { icon: Rocket, color: "text-green-400" },
};

const STAGES: SessionPipelineStage[] = ["results", "analysis", "discovery"];

interface ChatWelcomeProps {
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  currentStage: SessionStage;
  sessions: SessionItem[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function ChatWelcome({
  onSendMessage,
  isStreaming,
  currentStage,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
}: ChatWelcomeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { user } = useAuth();
  const t = useTranslations("Welcome");
  const tHistory = useTranslations("ChatHistory");
  const tTime = useTranslations("RelativeTime");

  const hasSessions = sessions.length > 0;

  // Extract first name from user's name
  const firstName = user?.name?.split(" ")[0] || "there";

  const stageLabels: Record<SessionPipelineStage, string> = {
    discovery: tHistory("discovery"),
    analysis: tHistory("analysis"),
    results: tHistory("results"),
  };

  function getRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return tTime("now");
    if (diffMins < 60) return tTime("minutesAgo", { minutes: diffMins });
    if (diffHours < 24) return tTime("hoursAgo", { hours: diffHours });
    if (diffDays === 1) return tTime("yesterday");
    if (diffDays < 7) return tTime("daysAgo", { days: diffDays });
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

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
    groupedSessions[stage];

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
                <h2 className="mb-4 text-base font-semibold text-foreground">
                  {t("yourChats")}
                </h2>
                <TabsList className="w-full">
                  {STAGES.map((stage) => {
                    const config = STAGE_ICONS[stage];
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
                {STAGES.map((stage) => (
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
                                onDelete={() => onDeleteSession(session.id)}
                                deleteLabel={tHistory("deleteSession", { title: session.title })}
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
    </div>
  );
}
