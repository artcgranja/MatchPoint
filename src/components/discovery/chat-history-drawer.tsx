"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SessionCard } from "@/components/discovery/session-card";
import { SessionActionDialogs } from "@/components/discovery/session-action-dialogs";
import { useSessionActions } from "@/hooks/use-session-actions";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { STAGE_CONFIG } from "@/lib/stage-config";
import type { SessionItem, SessionPipelineStage } from "@/types";

const STAGES: SessionPipelineStage[] = ["discovery", "analysis", "results"];

interface ChatHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: SessionItem[];
  currentSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => Promise<void> | void;
  onRename: (sessionId: string, newTitle: string) => Promise<string | null | void> | void;
}

export function ChatHistoryDrawer({
  open,
  onOpenChange,
  sessions,
  currentSessionId,
  onSelect,
  onDelete,
  onRename,
}: ChatHistoryDrawerProps) {
  const tHistory = useTranslations("ChatHistory");
  const tSearches = useTranslations("Searches");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const getRelativeTime = useRelativeTime();

  const sessionActions = useSessionActions({
    onDelete,
    onRename,
  });

  const stageLabels: Record<SessionPipelineStage, string> = {
    discovery: tHistory("discovery"),
    analysis: tHistory("analysis"),
    results: tHistory("results"),
  };

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

  const handleSeeAll = () => {
    onOpenChange(false);
    router.push("/searches");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <div className="flex flex-row items-center justify-between">
            <DrawerTitle>{tHistory("yourChats")}</DrawerTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSeeAll}
              className="shrink-0"
            >
              {tSearches("seeAll")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <Tabs defaultValue="discovery" className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <TabsList className="w-full">
            {STAGES.map((stage) => {
              const config = STAGE_CONFIG[stage];
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

          {STAGES.map((stage) => (
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
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DrawerContent>

      <SessionActionDialogs actions={sessionActions} />
    </Drawer>
  );
}
