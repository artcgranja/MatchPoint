"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { motion } from "motion/react";
import { Inbox, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConnectionsStore, type BuilderConnection } from "@/stores/connections-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { ConnectionStatusBadge } from "./connection-status-badge";
import { ConnectionDetailSheet } from "./connection-detail-sheet";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { cardStagger, cardEntrance } from "@/lib/motion";

export function BuilderHomePage() {
  const t = useTranslations("BuilderInbox");
  const searchParams = useSearchParams();
  const router = useRouter();
  const connections = useConnectionsStore((s) => s.builderConnections);
  const acceptConnection = useConnectionsStore((s) => s.acceptConnection);
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const formatTime = useRelativeTime();

  const [selectedConnection, setSelectedConnection] = useState<BuilderConnection | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Build a set of connection IDs that have unread notifications
  const unreadConnectionIds = new Set(
    notifications
      .filter((n) => !n.read && n.type === "connection_request" && n.metadata)
      .map((n) => (n.metadata as Record<string, unknown>)?.connectionId as string)
      .filter(Boolean)
  );

  // Find notification for a given connection ID
  const findNotificationForConnection = useCallback(
    (connectionId: string) =>
      notifications.find(
        (n) =>
          !n.read &&
          n.type === "connection_request" &&
          (n.metadata as Record<string, unknown>)?.connectionId === connectionId
      ),
    [notifications]
  );

  // Deep link: auto-open connection from ?conn= query param
  useEffect(() => {
    const connId = searchParams.get("conn");
    if (connId && connections.length > 0) {
      const connection = connections.find((c) => c.id === connId);
      if (connection) {
        setSelectedConnection(connection);
        setSheetOpen(true);

        // Mark related notification as read
        const notification = findNotificationForConnection(connId);
        if (notification) {
          markAsRead(notification.id);
        }

        // Clear query param
        router.replace("/", { scroll: false });
      }
    }
  }, [searchParams, connections, router, findNotificationForConnection, markAsRead]);

  const statusLabels = {
    pending: t("statusPending"),
    email_sent: t("statusEmailSent"),
    clicked: t("statusClicked"),
    accepted: t("statusAccepted"),
  };

  const handleConnectionClick = (conn: BuilderConnection) => {
    setSelectedConnection(conn);
    setSheetOpen(true);

    // Mark related notification as read when opening
    const notification = findNotificationForConnection(conn.id);
    if (notification) {
      markAsRead(notification.id);
    }
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
                onClick={() => handleConnectionClick(conn)}
                className="glass flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors hover:border-highlight/30"
              >
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-highlight/10 text-sm font-medium text-highlight">
                    {(conn.seeker.name ?? conn.seeker.email).charAt(0).toUpperCase()}
                  </div>
                  {unreadConnectionIds.has(conn.id) && (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-highlight" />
                  )}
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
