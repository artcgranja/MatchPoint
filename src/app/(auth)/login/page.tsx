"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Compass } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { fadeIn, slideUp } from "@/lib/motion";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Falha na autenticação. Tente novamente.",
  token_exchange: "Não foi possível conectar ao GitHub. Tente novamente.",
  no_email: "Nenhum email encontrado na sua conta GitHub. Verifique se você tem um email verificado.",
};

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="w-full max-w-sm"
      >
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          className="glass flex flex-col items-center gap-6 rounded-xl border border-border p-8"
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Compass className="h-8 w-8 text-highlight" />
            <span className="text-2xl font-bold font-heading">MatchPoint</span>
          </div>

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-lg font-semibold">Entre para continuar</h1>
            <p className="mt-1 text-sm text-foreground-muted">
              Conecte sua conta GitHub para começar a descobrir startups
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="w-full rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {ERROR_MESSAGES[error] ?? "Ocorreu um erro inesperado. Tente novamente."}
            </div>
          )}

          {/* GitHub button */}
          <Button asChild className="w-full gap-2" size="lg">
            <a href="/api/v1/auth/github">
              <GitHubIcon className="h-5 w-5" />
              Continuar com GitHub
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
