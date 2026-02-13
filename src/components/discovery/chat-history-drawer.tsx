"use client";

import { MessageSquare, FileText, Rocket, Trash2 } from "lucide-react";
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
import type { SessionItem, SessionPipelineStage } from "@/types";

const STAGE_CONFIG: Record<
  SessionPipelineStage,
  { label: string; icon: typeof MessageSquare; color: string; badgeClass: string }
> = {
  discovery: {
    label: "Descoberta",
    icon: MessageSquare,
    color: "text-blue-400",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  analysis: {
    label: "Análise",
    icon: FileText,
    color: "text-amber-400",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  results: {
    label: "Resultados",
    icon: Rocket,
    color: "text-green-400",
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/20",
  },
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
}

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
  const stages: SessionPipelineStage[] = ["discovery", "analysis", "results"];

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
          <DrawerTitle>Seus chats</DrawerTitle>
        </DrawerHeader>

        <Tabs defaultValue="discovery" className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <TabsList className="w-full">
            {stages.map((stage) => {
              const config = STAGE_CONFIG[stage];
              const count = countByStage(stage);
              return (
                <TabsTrigger key={stage} value={stage} className="flex-1 gap-2">
                  <config.icon className={cn("h-3.5 w-3.5", config.color)} />
                  {config.label}
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
                      Nenhum chat nessa etapa
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {sessionsByStage(stage).map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        isActive={session.id === currentSessionId}
                        onClick={() => handleCardClick(session.id)}
                        onDelete={() => onDelete(session.id)}
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

function SessionCard({
  session,
  isActive,
  onClick,
  onDelete,
}: {
  session: SessionItem;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const config = STAGE_CONFIG[session.pipelineStage];

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
      {/* Header: title + delete */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-1 text-sm font-medium text-foreground">
          {session.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Excluir: ${session.title}`}
          className="shrink-0 rounded p-0.5 text-foreground-muted/40 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Preview */}
      {session.preview && (
        <p className="line-clamp-2 text-xs text-foreground-muted/60">
          {session.preview}
        </p>
      )}

      {/* Footer: stage badge + time + result count */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn("text-[10px]", config.badgeClass)}>
          {config.label}
        </Badge>
        {session.hasResults && session.resultCount > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {session.resultCount} resultado{session.resultCount !== 1 ? "s" : ""}
          </Badge>
        )}
        <span className="ml-auto text-[10px] text-foreground-muted/40">
          {getRelativeTime(session.updatedAt)}
        </span>
      </div>
    </div>
  );
}
