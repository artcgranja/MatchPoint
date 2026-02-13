"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) {
        rafRef.current = null;
        return;
      }
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      ref.current?.style.setProperty("--mouse-x", `${x}%`);
      ref.current?.style.setProperty("--mouse-y", `${y}%`);
      rafRef.current = null;
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "spotlight-card shine-sweep glass rounded-2xl p-6 transition-all duration-300 hover:border-highlight/20",
        className
      )}
    >
      {children}
    </div>
  );
}
