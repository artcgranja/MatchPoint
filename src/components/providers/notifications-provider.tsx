"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationsStore } from "@/stores/notifications-store";

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
  const connectSSE = useNotificationsStore((s) => s.connectSSE);
  const reset = useNotificationsStore((s) => s.reset);

  useEffect(() => {
    if (user?.role === "builder") {
      fetchNotifications();
      connectSSE();
    } else {
      reset();
    }

    return () => reset();
  }, [user, fetchNotifications, connectSSE, reset]);

  return <>{children}</>;
}
