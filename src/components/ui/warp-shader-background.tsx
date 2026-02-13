"use client";

import { Suspense, lazy, useRef, useState, useEffect } from "react";

const Warp = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.Warp,
  }))
);

interface WarpShaderBackgroundProps {
  isHovered?: boolean;
  className?: string;
}

export function WarpShaderBackground({
  isHovered = false,
  className = "",
}: WarpShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Pause shader when off-screen
  const effectiveSpeed = isVisible ? (isHovered ? 0.8 : 0.3) : 0;

  return (
    <Suspense fallback={<div className="absolute inset-0 bg-void-lighter/20" />}>
      <div
        ref={containerRef}
        className={`absolute inset-0 z-0 pointer-events-none ${className}`}
      >
        <Warp
          style={{ height: "100%", width: "100%" }}
          proportion={0.45}
          softness={1}
          distortion={0.25}
          swirl={0.8}
          swirlIterations={6}
          shape="checks"
          shapeScale={0.1}
          scale={1}
          rotation={0}
          speed={effectiveSpeed}
          colors={[
            "hsl(217, 91%, 20%)",
            "hsl(217, 91%, 40%)",
            "hsl(215, 50%, 10%)",
            "hsl(215, 25%, 35%)",
          ]}
        />
      </div>
    </Suspense>
  );
}
