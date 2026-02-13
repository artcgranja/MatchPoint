"use client";

import { MessageSquare, FileText, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SessionCard } from "@/components/discovery/session-card";
import type { SessionItem, SessionPipelineStage } from "@/types";

const STAGE_ICONS: Record<SessionPipelineStage, { icon: typeof MessageSquare; color: string }> = {
  discovery: { icon: MessageSquare, color: "text-blue-400" },
  analysis: { icon: FileText, color: "text-amber-400" },
  results: { icon: Rocket, color: "text-green-400" },
};

interface ChatHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: SessionItem[];
  currentSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function ChatHistoryDrawer({
  open,
  onOpenChange,
  sessions,
  currentSessionId,
  onSelect,
  onDelete,
}: ChatHistoryDrawerProps) {
  const tHistory = useTranslations("ChatHistory");
  const tTime = useTranslations("RelativeTime");

  const stages: SessionPipelineStage[] = ["discovery", "analysis", "results"];

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

  const countByStage = (stage: SessionPipelineStage) =>
    sessions.filter((s) => s.pipelineStage === stage).length;

  const sessionsByStage = (stage: SessionPipelineStage) =>
    sessions
      .filter((s) => s.pipelineStage === stage)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleCardClick = (sessionId: string) => {
    onSelect(sessionId);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{tHistory("yourChats")}</DrawerTitle>
        </DrawerHeader>

        <Tabs defaultValue="discovery" className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <TabsList className="w-full">
            {stages.map((stage) => {
              const config = STAGE_ICONS[stage];
              const count = countByStage(stage);
              return (
                <TabsTrigger key={stage} value={stage} className="flex-1 gap-2">
                  <config.icon className={cn("h-3.5 w-3.5", config.color)} />
                  {stageLabels[stage]}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {stages.map((stage) => (
            <TabsContent key={stage} value={stage} className="mt-3 min-h-0 flex-1">
              <ScrollArea className="h-full max-h-[60vh]">
                {sessionsByStage(stage).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-foreground-muted/50">
                      {tHistory("noChatsInStage")}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {sessionsByStage(stage).map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        isActive={session.id === currentSessionId}
                        onClick={() => handleCardClick(session.id)}
                        onDelete={() => onDelete(session.id)}
                        deleteLabel={tHistory("deleteSession", { title: session.title })}
                        resultCountLabel={tHistory("resultCount", { count: session.resultCount })}
                        relativeTime={getRelativeTime(session.updatedAt)}
                        moreLabel={(count) => tHistory("moreStartups", { count })}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
}
