"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useConnectionsStore } from "@/stores/connections-store";

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const fetchConnections = useConnectionsStore((s) => s.fetchConnections);
  const fetchBuilderConnections = useConnectionsStore((s) => s.fetchBuilderConnections);
  const reset = useConnectionsStore((s) => s.reset);

  useEffect(() => {
    if (user) {
      if (user.role === "builder") {
        fetchBuilderConnections();
      } else {
        fetchConnections();
      }
    } else {
      reset();
    }
  }, [user, fetchConnections, fetchBuilderConnections, reset]);

  return <>{children}</>;
}
