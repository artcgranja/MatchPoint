"use client";

import { motion } from "motion/react";
import { Send, Check, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useConnectionsStore } from "@/stores/connections-store";
import { useLoginModalStore } from "@/stores/login-modal-store";

interface ConnectButtonProps {
  companyId: number;
  searchResultId?: string;
  hasContactEmail?: boolean;
  variant?: "icon" | "full";
  className?: string;
}

export function ConnectButton({
  companyId,
  searchResultId,
  hasContactEmail = true,
  variant = "icon",
  className,
}: ConnectButtonProps) {
  const t = useTranslations("Connections");
  const user = useAuthStore((s) => s.user);
  const status = useConnectionsStore((s) => s.getStatus(companyId));
  const isLoading = useConnectionsStore((s) => s.loadingCompanies.has(companyId));
  const createConnection = useConnectionsStore((s) => s.createConnection);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      useLoginModalStore.getState().openLoginModal();
      return;
    }

    if (status || isLoading || !hasContactEmail) return;

    createConnection(companyId, searchResultId);
  };

  const isSent = status === "email_sent" || status === "pending";
  const isAccepted = status === "accepted" || status === "clicked";

  if (variant === "full") {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        disabled={!!status || isLoading || !hasContactEmail}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          !status && !isLoading && hasContactEmail
            ? "bg-highlight text-white hover:bg-highlight/90"
            : isSent
              ? "bg-highlight/10 text-highlight border border-highlight/20"
              : isAccepted
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-surface-elevated text-foreground-muted cursor-not-allowed",
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("sending")}
          </>
        ) : isAccepted ? (
          <>
            <Check className="h-4 w-4" />
            {t("connected")}
          </>
        ) : isSent ? (
          <>
            <Mail className="h-4 w-4" />
            {t("emailSent")}
          </>
        ) : !hasContactEmail ? (
          <>
            <Send className="h-4 w-4" />
            {t("noEmail")}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t("connect")}
          </>
        )}
      </motion.button>
    );
  }

  // Icon variant (compact, for cards)
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={handleClick}
      disabled={!!status || isLoading || !hasContactEmail}
      aria-label={
        isAccepted ? t("connected") : isSent ? t("emailSent") : t("connect")
      }
      title={
        !hasContactEmail
          ? t("noEmail")
          : isAccepted
            ? t("connected")
            : isSent
              ? t("emailSent")
              : t("connect")
      }
      className={cn(
        "rounded-lg p-1 transition-colors",
        isLoading
          ? "text-highlight"
          : isAccepted
            ? "text-green-400"
            : isSent
              ? "text-highlight"
              : hasContactEmail
                ? "text-foreground-muted/40 hover:text-highlight"
                : "text-foreground-muted/20 cursor-not-allowed",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isAccepted ? (
        <Check className="h-3.5 w-3.5" />
      ) : isSent ? (
        <Mail className="h-3.5 w-3.5" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
    </motion.button>
  );
}
