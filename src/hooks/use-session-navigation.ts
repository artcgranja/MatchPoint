"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { useSearchStore } from "@/stores/search-store";

export function useSessionNavigation() {
  const router = useRouter();

  const goToSession = useCallback(
    (sessionId: string) => {
      useDiscoveryStore.getState().reset();
      useAgentPanelStore.getState().reset();
      useSearchStore.getState().resetPipeline();
      useDiscoveryStore.getState().setIsLoadingSession(true);
      useDiscoveryStore.getState().setSessionId(sessionId);
      router.push("/");
    },
    [router]
  );

  const goHome = useCallback(() => {
    useDiscoveryStore.getState().reset();
    useAgentPanelStore.getState().reset();
    useSearchStore.getState().resetPipeline();
    router.replace("/");
  }, [router]);

  return { goToSession, goHome };
}
