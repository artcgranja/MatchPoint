"use client";

import { motion } from "motion/react";
import { Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useSavedStartupsStore } from "@/stores/saved-startups-store";
import { useLoginModalStore } from "@/stores/login-modal-store";

interface SaveButtonProps {
  companyId: number;
  size?: "sm" | "default";
  className?: string;
}

export function SaveButton({ companyId, size = "default", className }: SaveButtonProps) {
  const t = useTranslations("Saved");
  const user = useAuthStore((s) => s.user);
  const isSaved = useSavedStartupsStore((s) => s.savedIds.has(companyId));
  const saveStartup = useSavedStartupsStore((s) => s.saveStartup);
  const unsaveStartup = useSavedStartupsStore((s) => s.unsaveStartup);

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const padding = size === "sm" ? "p-1" : "p-1.5";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      useLoginModalStore.getState().openLoginModal();
      return;
    }

    if (isSaved) {
      unsaveStartup(companyId);
    } else {
      saveStartup(companyId);
    }
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={handleClick}
      aria-label={isSaved ? t("unsave") : t("save")}
      className={cn(
        "rounded-lg transition-colors",
        padding,
        isSaved
          ? "text-highlight hover:text-highlight/80"
          : "text-foreground-muted/40 hover:text-foreground-muted",
        className
      )}
    >
      <Bookmark
        className={cn(iconSize, isSaved && "fill-current")}
      />
    </motion.button>
  );
}
