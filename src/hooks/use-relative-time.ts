"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

export function useRelativeTime() {
  const t = useTranslations("RelativeTime");

  return useCallback(
    (dateStr: string): string => {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return t("now");
      if (diffMins < 60) return t("minutesAgo", { minutes: diffMins });
      if (diffHours < 24) return t("hoursAgo", { hours: diffHours });
      if (diffDays === 1) return t("yesterday");
      if (diffDays < 7) return t("daysAgo", { days: diffDays });
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    },
    [t]
  );
}
