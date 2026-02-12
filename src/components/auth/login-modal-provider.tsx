"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LoginModal } from "@/components/auth/login-modal";
import { useLoginModalStore } from "@/stores/login-modal-store";

/**
 * Wraps the app and renders LoginModal. Opens modal when URL has auth_error
 * (e.g. OAuth callback redirects with ?auth_error=xxx) or login=1.
 */
export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const openLoginModal = useLoginModalStore((s) => s.openLoginModal);

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    const shouldOpen = searchParams.get("login");
    if (authError || shouldOpen) {
      openLoginModal(authError ?? undefined);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, openLoginModal]);

  return (
    <>
      {children}
      <LoginModal />
    </>
  );
}
