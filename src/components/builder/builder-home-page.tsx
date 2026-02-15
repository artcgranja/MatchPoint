"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Inbox, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConnectionsStore, type BuilderConnection } from "@/stores/connections-store";
import { ConnectionStatusBadge } from "./connection-status-badge";
import { ConnectionDetailSheet } from "./connection-detail-sheet";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { cardStagger, cardEntrance } from "@/lib/motion";

export function BuilderHomePage() {
  const t = useTranslations("BuilderInbox");
  const connections = useConnectionsStore((s) => s.builderConnections);
  const acceptConnection = useConnectionsStore((s) => s.acceptConnection);
  const formatTime = useRelativeTime();

  const [selectedConnection, setSelectedConnection] = useState<BuilderConnection | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const statusLabels = {
    pending: t("statusPending"),
    email_sent: t("statusEmailSent"),
    clicked: t("statusClicked"),
    accepted: t("statusAccepted"),
  };

  const handleAccept = async (id: string) => {
    setIsAccepting(true);
    try {
      await acceptConnection(id);
      setSelectedConnection((prev) =>
        prev?.id === id ? { ...prev, status: "accepted" as const } : prev
      );
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-6 space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Inbox className="h-6 w-6 text-highlight" />
            {t("title")}
          </h1>
          <p className="text-sm text-foreground-muted">{t("description")}</p>
        </div>

        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Mail className="h-10 w-10 text-foreground-muted/30" />
            <p className="text-foreground-muted">{t("empty")}</p>
            <p className="text-sm text-foreground-muted/60">{t("emptyHint")}</p>
          </div>
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
                  setSelectedConnection(conn);
                  setSheetOpen(true);
                }}
                className="glass flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors hover:border-highlight/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-highlight/10 text-sm font-medium text-highlight">
                  {(conn.seeker.name ?? conn.seeker.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {conn.seeker.name ?? conn.seeker.email}
                    </span>
                    <ConnectionStatusBadge status={conn.status} labels={statusLabels} />
                  </div>
                  <p className="truncate text-sm text-foreground-muted">{conn.emailSubject}</p>
                </div>
                <span className="shrink-0 text-xs text-foreground-muted">
                  {formatTime(conn.createdAt)}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      <ConnectionDetailSheet
        connection={selectedConnection}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAccept={handleAccept}
        isAccepting={isAccepting}
      />
    </div>
  );
}
