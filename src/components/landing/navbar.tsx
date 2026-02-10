"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="glass fixed top-0 z-50 w-full">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-highlight" />
          <span className="text-lg font-bold font-heading">MatchPoint</span>
        </Link>

        <div className="flex items-center gap-6">
          <a
            href="#features"
            className="hidden text-sm text-foreground-muted hover:text-foreground transition-colors sm:block"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hidden text-sm text-foreground-muted hover:text-foreground transition-colors sm:block"
          >
            How it Works
          </a>
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="/search">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
