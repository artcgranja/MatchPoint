"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { EASE_OUT_EXPO } from "@/lib/motion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const discoveryState = useDiscoveryStore((s) => s.discoveryState);
  const user = useAuthStore((s) => s.user);
  const collapsed = useSidebarStore((s) => s.collapsed);

  const isHomePage = pathname === "/";
  const showSidebar = !isHomePage || discoveryState !== "idle" || !!user;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-screen overflow-hidden">
        <AnimatePresence initial={false}>
          {showSidebar && (
            <motion.div
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: collapsed ? 64 : 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="shrink-0 overflow-hidden"
            >
              <AppSidebar />
            </motion.div>
          )}
        </AnimatePresence>
        <main id="main-content" className="flex flex-1 flex-col min-h-0">
          {children}
        </main>
      </div>
    </MotionConfig>
  );
}
