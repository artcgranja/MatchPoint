"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConnectionsStore, type SeekerConnection } from "@/stores/connections-store";
import { ConnectionStatusBadge } from "@/components/builder/connection-status-badge";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { useAuthStore } from "@/stores/auth-store";
import { useLoginModalStore } from "@/stores/login-modal-store";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { ConnectionChat } from "@/components/connections/connection-chat";
import { cardStagger, cardEntrance } from "@/lib/motion";

export default function ConexoesPage() {
  const t = useTranslations("SeekerConnections");
  const tStatus = useTranslations("BuilderInbox");
  const user = useAuthStore((s) => s.user);
  const connections = useConnectionsStore((s) => s.seekerConnections);
  const formatTime = useRelativeTime();

  const [selected, setSelected] = useState<SeekerConnection | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const statusLabels = {
    pending: tStatus("statusPending"),
    email_sent: tStatus("statusEmailSent"),
    clicked: tStatus("statusClicked"),
    accepted: tStatus("statusAccepted"),
  };

  if (!user) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
        <SectionHeader title={t("title")} description={t("description")} />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Send className="h-12 w-12 text-foreground-muted/30" />
          <p className="text-foreground-muted">{t("loginRequired")}</p>
          <Button onClick={() => useLoginModalStore.getState().openLoginModal()}>
            {t("loginButton")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      <SectionHeader title={t("title")} description={t("description")} />

      {connections.length === 0 ? (
        <EmptyState
          icon={Send}
          title={t("empty")}
          description={t("emptyHint")}
          action={
            <Button asChild variant="outline">
              <Link href="/descubra">{t("startExploring")}</Link>
            </Button>
          }
        />
      ) : (
        <motion.div
          variants={cardStagger}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {connections.map((conn) => (
            <motion.button
              key={conn.id}
              variants={cardEntrance}
              onClick={() => {
                setSelected(conn);
                setSheetOpen(true);
              }}
              className="glass flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors hover:border-highlight/30"
            >
              {conn.company.smallLogoUrl ? (
                <img
                  src={conn.company.smallLogoUrl}
                  alt={conn.company.name}
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-highlight/10 text-sm font-medium text-highlight">
                  {conn.company.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{conn.company.name}</span>
                  <ConnectionStatusBadge status={conn.status} labels={statusLabels} />
                </div>
                <p className="truncate text-sm text-foreground-muted">{conn.company.oneLiner}</p>
              </div>
              <span className="shrink-0 text-xs text-foreground-muted">
                {formatTime(conn.createdAt)}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col p-0 sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="border-b border-border px-4 pt-4 pb-3">
                <SheetTitle>{selected.company.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <ConnectionStatusBadge status={selected.status} labels={statusLabels} />
                  <span className="text-xs text-foreground-muted">{formatTime(selected.createdAt)}</span>
                </SheetDescription>
              </SheetHeader>
              <ConnectionChat
                connectionId={selected.id}
                connectionStatus={selected.status}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
