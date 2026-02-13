"use client";

import { Compass } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLoginModalStore } from "@/stores/login-modal-store";
import { slideUp } from "@/lib/motion";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

/**
 * Login modal shown when user needs to authenticate.
 * Uses GitHub OAuth. Controlled by useLoginModalStore.
 */
export function LoginModal() {
  const { open, error, closeLoginModal } = useLoginModalStore();
  const t = useTranslations("Auth");

  const ERROR_MESSAGES: Record<string, string> = {
    invalid_state: t("loginError"),
    token_exchange: t("loginConnectionError"),
    no_email: t("loginNoEmail"),
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeLoginModal()}>
      <DialogContent
        showCloseButton={true}
        className="sm:max-w-md"
      >
        <DialogHeader className="gap-4">
          {/* Logo */}
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center gap-2"
          >
            <Compass className="h-8 w-8 text-highlight" />
            <span className="text-2xl font-bold font-heading">MatchPoint</span>
          </motion.div>

          <DialogTitle className="text-center">
            {t("loginTitle")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("loginDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-2">
          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {ERROR_MESSAGES[error] ?? t("loginUnexpectedError")}
            </div>
          )}

          {/* GitHub OAuth button */}
          <Button asChild className="w-full gap-2" size="lg">
            <a href="/api/v1/auth/github">
              <GitHubIcon className="h-5 w-5" />
              {t("continueWithGitHub")}
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
