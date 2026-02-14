import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SavedStartupsProvider } from "@/components/providers/saved-startups-provider";
import { AppShell } from "@/components/layout/app-shell";
import type { AuthUser } from "@/stores/auth-store";

export const metadata: Metadata = {
  title: {
    default: "MatchPoint",
    template: "%s | MatchPoint",
  },
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const jwtPayload = await getAuthUser();
  const initialUser: AuthUser | null = jwtPayload
    ? { id: jwtPayload.userId, email: jwtPayload.email, name: null, avatarUrl: null }
    : null;

  return (
    <AuthProvider initialUser={initialUser}>
      <SavedStartupsProvider>
        <AppShell>{children}</AppShell>
      </SavedStartupsProvider>
    </AuthProvider>
  );
}
