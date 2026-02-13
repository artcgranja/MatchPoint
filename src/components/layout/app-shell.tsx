"use client";

import { usePathname } from "@/i18n/navigation";
import { motion, MotionConfig } from "motion/react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAuth } from "@/components/providers/auth-provider";
import { useSidebarStore } from "@/stores/sidebar-store";
import { EASE_OUT_EXPO } from "@/lib/motion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const discoveryState = useDiscoveryStore((s) => s.discoveryState);
  const { user } = useAuth();
  const collapsed = useSidebarStore((s) => s.collapsed);

  const isHomePage = pathname === "/";
  const isActiveChat = discoveryState !== "idle";
  const showSidebar = !isActiveChat && (!isHomePage || !!user);

  const sidebarWidth = showSidebar ? (collapsed ? 64 : 240) : 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-screen overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: sidebarWidth, opacity: showSidebar ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="shrink-0 overflow-hidden"
        >
          {showSidebar && <AppSidebar />}
        </motion.div>
        <main id="main-content" className="flex flex-1 flex-col min-h-0">
          {children}
        </main>
      </div>
    </MotionConfig>
  );
}
