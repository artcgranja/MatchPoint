"use client";

import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from "react";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";

const InitialAuthContext = createContext<AuthUser | null>(null);

/**
 * Tracks whether the app has mounted on the client. During SSR and the
 * initial hydration pass `getSnapshot` returns false while
 * `getServerSnapshot` also returns false — so server and client agree.
 * After the first commit, the subscribe callback flips the flag and
 * React re-renders with `true`, at which point Zustand state is trusted.
 */
const mountedRef = { current: false };
const mountListeners = new Set<() => void>();

function subscribeMounted(cb: () => void) {
  mountListeners.add(cb);
  return () => { mountListeners.delete(cb); };
}

function getMounted() { return mountedRef.current; }
function getServerMounted() { return false; }

function useHasMounted() {
  return useSyncExternalStore(subscribeMounted, getMounted, getServerMounted);
}

/**
 * Returns the current auth user. During SSR and the hydration pass the
 * server-seeded `initialUser` from Context is used, guaranteeing that
 * server and client HTML match. After mount, Zustand takes over.
 */
export function useAuth() {
  const storeUser = useAuthStore((s) => s.user);
  const storeLoading = useAuthStore((s) => s.isLoading);
  const initialUser = useContext(InitialAuthContext);
  const hasMounted = useHasMounted();

  // Before mount: always use the server-seeded value (prevents hydration mismatch)
  if (!hasMounted) {
    return { user: initialUser, isLoading: false };
  }

  // After mount: trust the Zustand store
  return { user: storeUser, isLoading: storeLoading };
}

interface AuthProviderProps {
  initialUser: AuthUser | null;
  children: React.ReactNode;
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const seeded = useRef(false);

  // Seed Zustand synchronously so it's ready when `hasMounted` flips to true
  if (!seeded.current) {
    seeded.current = true;
    if (initialUser) {
      useAuthStore.setState({ user: initialUser, isLoading: false });
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }

  // After mount: flip the mounted flag and notify all useHasMounted consumers
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      mountListeners.forEach((cb) => cb());
    }
  }, []);

  // Fetch full user data (name, avatar) from /api/v1/auth/me
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <InitialAuthContext.Provider value={initialUser}>
      {children}
    </InitialAuthContext.Provider>
  );
}
