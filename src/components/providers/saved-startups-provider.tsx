"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSavedStartupsStore } from "@/stores/saved-startups-store";

export function SavedStartupsProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const fetchSavedIds = useSavedStartupsStore((s) => s.fetchSavedIds);
  const reset = useSavedStartupsStore((s) => s.reset);

  useEffect(() => {
    if (user) {
      fetchSavedIds();
    } else {
      reset();
    }
  }, [user, fetchSavedIds, reset]);

  return <>{children}</>;
}
