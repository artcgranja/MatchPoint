"use client";

import { useTranslations } from "next-intl";
import { Mail, User, Calendar } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ConnectionStatusBadge } from "./connection-status-badge";
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
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{connection.seeker.name ?? connection.seeker.email}</SheetTitle>
          <SheetDescription>{connection.seeker.email}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <div className="flex items-center gap-3">
            <ConnectionStatusBadge status={connection.status} labels={statusLabels} />
            <span className="flex items-center gap-1 text-xs text-foreground-muted">
              <Calendar className="h-3 w-3" />
              {formatTime(connection.createdAt)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-foreground-muted" />
              {t("seekerInfo")}
            </div>
            <div className="rounded-lg bg-background-secondary/50 p-3 text-sm">
              <p>{connection.seeker.name ?? "—"}</p>
              <p className="text-foreground-muted">{connection.seeker.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-foreground-muted" />
              {t("emailContent")}
            </div>
            <div className="space-y-2 rounded-lg bg-background-secondary/50 p-3">
              <p className="text-sm font-medium">{connection.emailSubject}</p>
              <p className="whitespace-pre-wrap text-sm text-foreground-muted">
                {connection.emailBody}
              </p>
            </div>
          </div>

          {connection.status !== "accepted" && (
            <Button
              className="w-full"
              onClick={() => onAccept(connection.id)}
              disabled={isAccepting}
            >
              {isAccepting ? t("accepting") : t("accept")}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
