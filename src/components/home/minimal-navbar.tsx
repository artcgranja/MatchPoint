"use client";

import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { useLoginModalStore } from "@/stores/login-modal-store";
import { getInitials } from "@/lib/utils/user";

export function MinimalNavbar() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const initials = getInitials(user?.name);

  return (
    <nav aria-label="Navegação principal" className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5 sm:px-8">
      <Link href="/" className="group flex items-center">
        <Image
          src="/astro-logo.svg"
          alt="Astro Intelligence"
          width={120}
          height={24}
          priority
          className="logo-adaptive h-5 sm:h-6 w-auto opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        />
      </Link>

      {!isLoading && (
        user ? (
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-sm font-medium text-text">
              {user.name ?? user.email}
            </span>
            <Avatar className="h-7 w-7">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name ?? ""} />
              )}
              <AvatarFallback className="bg-highlight/15 text-highlight text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => useLoginModalStore.getState().openLoginModal()}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-text backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
          >
            <LogIn className="h-3.5 w-3.5" />
            Entrar
          </button>
        )
      )}
    </nav>
  );
}
