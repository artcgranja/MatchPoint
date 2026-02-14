"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion } from "motion/react";
import { Compass, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { apiPut } from "@/lib/api/client";
import { scaleIn, staggerContainer, EASE_OUT_EXPO } from "@/lib/motion";
import type { AuthUser } from "@/stores/auth-store";

export default function OnboardingPage() {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setRole = useAuthStore((s) => s.setRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.roleChosenAt) {
      router.replace("/");
    }
  }, [user, router]);

  if (user?.roleChosenAt) {
    return null;
  }

  const handleSelectRole = async (role: "seeker" | "builder") => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const updated = await apiPut<AuthUser>("/auth/role", { role });
      setRole(updated.role, updated.roleChosenAt!);

      if (role === "builder") {
        router.push("/onboarding/company");
      } else {
        router.push("/");
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-4">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl space-y-8 text-center"
      >
        <motion.div variants={scaleIn} className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-foreground-muted">{t("subtitle")}</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.button
            variants={scaleIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            onClick={() => handleSelectRole("seeker")}
            disabled={isSubmitting}
            className="glass flex flex-col items-center gap-4 rounded-xl p-8 text-left transition-colors hover:border-highlight/50 disabled:opacity-50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-highlight/10">
              <Compass className="h-7 w-7 text-highlight" />
            </div>
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-semibold">{t("seekerTitle")}</h2>
              <p className="text-sm text-foreground-muted">{t("seekerDescription")}</p>
            </div>
          </motion.button>

          <motion.button
            variants={scaleIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            onClick={() => handleSelectRole("builder")}
            disabled={isSubmitting}
            className="glass flex flex-col items-center gap-4 rounded-xl p-8 text-left transition-colors hover:border-sage/50 disabled:opacity-50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sage/10">
              <Building2 className="h-7 w-7 text-sage" />
            </div>
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-semibold">{t("builderTitle")}</h2>
              <p className="text-sm text-foreground-muted">{t("builderDescription")}</p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
