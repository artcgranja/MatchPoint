"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";

const InitialAuthContext = createContext<AuthUser | null>(null);

/**
 * Returns the current auth user, falling back to the server-seeded value
 * when the Zustand store hasn't hydrated yet. This prevents the flash of
 * unauthenticated content on page reload.
 */
export function useAuth() {
  const storeUser = useAuthStore((s) => s.user);
  const storeLoading = useAuthStore((s) => s.isLoading);
  const initialUser = useContext(InitialAuthContext);

  // Store hasn't resolved yet → use server-side value
  if (storeLoading && !storeUser) {
    return { user: initialUser, isLoading: false };
  }

  return { user: storeUser, isLoading: storeLoading };
}

interface AuthProviderProps {
  initialUser: AuthUser | null;
  children: React.ReactNode;
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const seeded = useRef(false);

  // Best-effort sync seeding — context fallback handles the case where this
  // doesn't propagate to children during SSR/hydration
  if (!seeded.current) {
    seeded.current = true;
    if (initialUser) {
      useAuthStore.setState({ user: initialUser, isLoading: false });
    }
  }

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <InitialAuthContext.Provider value={initialUser}>
      {children}
    </InitialAuthContext.Provider>
  );
}
