"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

export function MinimalNavbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5 sm:px-8">
      <Link href="/" className="group flex items-center">
        <img
          src="/astro-logo.svg"
          alt="Astro Intelligence"
          className="logo-adaptive h-5 sm:h-6 w-auto opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        />
      </Link>

      <Link
        href="/api/v1/auth/login"
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-text backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
      >
        <LogIn className="h-3.5 w-3.5" />
        Sign In
      </Link>
    </nav>
  );
}
