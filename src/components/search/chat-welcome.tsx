"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  MessageSquare,
  FileText,
  Rocket,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { WarpShaderBackground } from "@/components/ui/warp-shader-background";
import { ChatInput } from "@/components/discovery/chat-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { slideUp, staggerContainer } from "@/lib/motion";
import type { SessionItem, SessionPipelineStage, SessionStage } from "@/types";

const STAGE_ICONS: Record<SessionPipelineStage, { icon: typeof MessageSquare; color: string; badgeClass: string }> = {
  discovery: {
    icon: MessageSquare,
    color: "text-blue-400",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  analysis: {
    icon: FileText,
    color: "text-amber-400",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  results: {
    icon: Rocket,
    color: "text-green-400",
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/20",
  },
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
  const t = useTranslations("Welcome");
  const tHistory = useTranslations("ChatHistory");
  const tTime = useTranslations("RelativeTime");

  const hasSessions = sessions.length > 0;

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
        {prefersReducedMotion ? (
          <div
            className="h-screen w-full"
            style={{
              background:
                "radial-gradient(ellipse at 50% 80%, hsl(217, 91%, 20%) 0%, hsl(215, 50%, 10%) 40%, transparent 70%)",
            }}
          />
        ) : (
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
            <WarpShaderBackground isHovered={isHovered} />
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
            {t.rich("title", {
              gradient: (chunks) => <span className="text-gradient">{chunks}</span>,
            })}
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
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-2xl backdrop-blur-xl">
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
                    <ScrollArea className="max-h-[50vh]">
                      <div className="px-6">
                        {sessionsByStage(stage).length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-sm text-foreground-muted/50">
                              {t("noChatsInStage")}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {sessionsByStage(stage).map((session) => (
                              <SessionCard
                                key={session.id}
                                session={session}
                                isActive={session.id === currentSessionId}
                                onClick={() => onSelectSession(session.id)}
                                onDelete={() => onDeleteSession(session.id)}
                                stageLabel={stageLabels[session.pipelineStage]}
                                badgeClass={STAGE_ICONS[session.pipelineStage].badgeClass}
                                resultCountLabel={tHistory("resultCount", { count: session.resultCount })}
                                deleteLabel={tHistory("deleteSession", { title: session.title })}
                                relativeTime={getRelativeTime(session.updatedAt)}
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

function SessionCard({
  session,
  isActive,
  onClick,
  onDelete,
  stageLabel,
  badgeClass,
  resultCountLabel,
  deleteLabel,
  relativeTime,
}: {
  session: SessionItem;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  stageLabel: string;
  badgeClass: string;
  resultCountLabel: string;
  deleteLabel: string;
  relativeTime: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3 transition-colors",
        isActive
          ? "border-highlight/30 bg-highlight/5"
          : "border-border hover:border-foreground-muted/20 hover:bg-background-secondary"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-1 text-sm font-medium text-foreground">
          {session.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={deleteLabel}
          className="shrink-0 rounded p-0.5 text-foreground-muted/40 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {session.preview && (
        <p className="line-clamp-2 text-xs text-foreground-muted/60">
          {session.preview}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn("text-[10px]", badgeClass)}>
          {stageLabel}
        </Badge>
        {session.hasResults && session.resultCount > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {resultCountLabel}
          </Badge>
        )}
        <span className="ml-auto text-[10px] text-foreground-muted/40">
          {relativeTime}
        </span>
      </div>
    </div>
  );
}
