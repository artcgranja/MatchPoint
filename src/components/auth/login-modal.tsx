"use client";

import { useState } from "react";
import { Compass, Mail, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoginModalStore } from "@/stores/login-modal-store";
import { slideUp } from "@/lib/motion";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LoginTabContent({ role }: { role: "seeker" | "builder" }) {
  const t = useTranslations("Auth");
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSending, setMagicSending] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const githubUrl = role === "builder"
    ? "/api/v1/auth/github?role=builder"
    : "/api/v1/auth/github";

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* GitHub OAuth button */}
      <Button asChild className="w-full gap-2" size="lg">
        <a href={githubUrl}>
          <GitHubIcon className="h-5 w-5" />
          {t("continueWithGitHub")}
        </a>
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-divider" />
        <span className="text-xs text-foreground-muted">{t("or")}</span>
        <div className="h-px flex-1 bg-divider" />
      </div>

      {/* Magic Link */}
      {magicSent ? (
        <div className="rounded-lg bg-highlight/10 border border-highlight/20 px-4 py-3 text-sm text-highlight text-center">
          <Mail className="h-4 w-4 inline-block mr-2" />
          {t("checkYourEmail")}
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!magicEmail.trim() || magicSending) return;
            setMagicSending(true);
            try {
              await fetch("/api/v1/auth/magic-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: magicEmail.trim(), role }),
              });
              setMagicSent(true);
            } finally {
              setMagicSending(false);
            }
          }}
          className="flex gap-2"
        >
          <Input
            type="email"
            placeholder={t("emailPlaceholder")}
            value={magicEmail}
            onChange={(e) => setMagicEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" variant="outline" disabled={magicSending} className="gap-2 shrink-0">
            {magicSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {t("sendMagicLink")}
          </Button>
        </form>
      )}
    </div>
  );
}

/**
 * Login modal shown when user needs to authenticate.
 * Has Seeker / Builder tabs. Controlled by useLoginModalStore.
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

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {ERROR_MESSAGES[error] ?? t("loginUnexpectedError")}
          </div>
        )}

        <Tabs defaultValue="seeker" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="seeker">Seeker</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
          </TabsList>
          <TabsContent value="seeker">
            <LoginTabContent role="seeker" />
          </TabsContent>
          <TabsContent value="builder">
            <LoginTabContent role="builder" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
