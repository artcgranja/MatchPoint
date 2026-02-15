"use client";

import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ConnectionStatusBadge } from "./connection-status-badge";
import { ConnectionChat } from "@/components/connections/connection-chat";
import { useRelativeTime } from "@/hooks/use-relative-time";
import type { BuilderConnection } from "@/stores/connections-store";

export function ConnectionDetailSheet({
  connection,
  open,
  onOpenChange,
  onAccept,
  isAccepting,
}: {
  connection: BuilderConnection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (id: string) => void;
  isAccepting: boolean;
}) {
  const t = useTranslations("BuilderInbox");
  const formatTime = useRelativeTime();

  if (!connection) return null;

  const statusLabels = {
    pending: t("statusPending"),
    email_sent: t("statusEmailSent"),
    clicked: t("statusClicked"),
    accepted: t("statusAccepted"),
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 pt-4 pb-3">
          <SheetTitle>{connection.seeker.name ?? connection.seeker.email}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <ConnectionStatusBadge status={connection.status} labels={statusLabels} />
            <span className="text-xs text-foreground-muted">{formatTime(connection.createdAt)}</span>
          </SheetDescription>
        </SheetHeader>
        <ConnectionChat
          connectionId={connection.id}
          connectionStatus={connection.status}
          onAccept={onAccept}
          isAccepting={isAccepting}
          isBuilder
        />
      </SheetContent>
    </Sheet>
  );
}
