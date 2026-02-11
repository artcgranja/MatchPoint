"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-void/50 backdrop-blur-xl py-3 sm:py-4"
          : "py-6 sm:py-8 bg-transparent"
      }`}
    >
      <div className="w-full px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        <Link href="/" className="group flex items-center">
          <img
            src="/astro-logo.svg"
            alt="Astro Intelligence"
            className="logo-adaptive h-5 sm:h-6 w-auto opacity-90 transition-opacity duration-300 group-hover:opacity-100"
          />
        </Link>

        <div className="flex items-center gap-3">
          <a
            href="#features"
            className="hidden sm:flex items-center font-display text-sm font-medium px-5 py-2.5 rounded-full text-text-dim hover:text-text hover:bg-surface-hover transition-all duration-300"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hidden sm:flex items-center font-display text-sm font-medium px-5 py-2.5 rounded-full text-text-dim hover:text-text hover:bg-surface-hover transition-all duration-300"
          >
            How it Works
          </a>
          <Link
            href="/search"
            className="flex items-center font-display text-sm font-medium px-5 py-2.5 sm:px-6 rounded-full border border-border-strong text-text hover:bg-surface-hover hover:border-border-bold transition-all duration-300"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
