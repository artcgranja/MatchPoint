"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { EASE_OUT_EXPO } from "@/lib/motion";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const discoveryState = useDiscoveryStore((s) => s.discoveryState);

  const isHomePage = pathname === "/";
  const chatIsActive = discoveryState !== "idle";
  const showSidebar = !isHomePage || chatIsActive;

  return (
    <AuthProvider>
    <div className={`flex h-screen ${chatIsActive ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"}`}>
      <AnimatePresence initial={false}>
        {showSidebar && (
          <motion.div
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="shrink-0 overflow-hidden"
          >
            <AppSidebar />
          </motion.div>
        )}
      </AnimatePresence>
      <main className={`flex flex-1 flex-col ${chatIsActive ? "min-h-0 overflow-hidden" : "min-h-screen"}`}>
        {children}
      </main>
    </div>
    </AuthProvider>
  );
}
