"use client";

import { motion } from "motion/react";
import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface AnimatedGradientBackgroundProps {
  /**
   * Initial size of the radial gradient, defining the starting width.
   * @default 110
   */
  startingGap?: number;

  /**
   * Enables or disables the breathing animation effect.
   * @default false
   */
  Breathing?: boolean;

  /**
   * Speed of the breathing animation.
   * Lower values result in slower animation.
   * @default 0.02
   */
  animationSpeed?: number;

  /**
   * Maximum range for the breathing animation in percentage points.
   * Determines how much the gradient "breathes" by expanding and contracting.
   * @default 5
   */
  breathingRange?: number;

  /**
   * Additional inline styles for the gradient container.
   * @default {}
   */
  containerStyle?: React.CSSProperties;

  /**
   * Additional class names for the gradient container.
   * @default ""
   */
  containerClassName?: string;

  /**
   * Additional top offset for the gradient container from the top to have a more flexible control over the gradient.
   * @default 0
   */
  topOffset?: number;
}

/**
 * AnimatedGradientBackground
 *
 * This component renders a customizable animated radial gradient background with a subtle breathing effect.
 * It uses `motion/react` for an entrance animation and raw CSS gradients for the dynamic background.
 * Adapts to the current theme (dark/light) using Astro Intelligence design system colors.
 */
const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  startingGap = 125,
  Breathing = true,
  animationSpeed = 0.02,
  breathingRange = 5,
  containerStyle = {},
  topOffset = 0,
  containerClassName = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let animationFrame: number;
    let width = startingGap;
    let directionWidth = 1;

    const animateGradient = () => {
      if (width >= startingGap + breathingRange) directionWidth = -1;
      if (width <= startingGap - breathingRange) directionWidth = 1;

      if (!Breathing) directionWidth = 0;
      width += directionWidth * animationSpeed;

      // Theme-aware gradient colors using Astro Intelligence design system
      const isDark = resolvedTheme === "dark";

      const gradientColors = isDark
        ? [
            "#020810",   // Deep space background
            "#0a1420",   // Secondary dark
            "#1e3a8a",   // Deep blue
            "#2563eb",   // Highlight blue
            "#3b82f6",   // Primary highlight
            "#6B8E6B",   // Sage green
            "#0a1420",   // Fade back to secondary
          ]
        : [
            "#FAFAF8",   // Light background
            "#ECEEE9",   // Secondary light
            "#bfdbfe",   // Light blue
            "#60a5fa",   // Bright blue
            "#3b82f6",   // Primary highlight
            "#86b886",   // Light sage
            "#ECEEE9",   // Fade back to secondary
          ];

      const gradientStops = [20, 35, 50, 60, 70, 85, 100];

      const gradientStopsString = gradientStops
        .map((stop, index) => `${gradientColors[index]} ${stop}%`)
        .join(", ");

      const gradient = `radial-gradient(${width}% ${width + topOffset}% at 50% 20%, ${gradientStopsString})`;

      if (containerRef.current) {
        containerRef.current.style.background = gradient;
      }

      animationFrame = requestAnimationFrame(animateGradient);
    };

    animationFrame = requestAnimationFrame(animateGradient);

    return () => cancelAnimationFrame(animationFrame);
  }, [startingGap, Breathing, animationSpeed, breathingRange, topOffset, resolvedTheme]);

  return (
    <motion.div
      key="animated-gradient-background"
      initial={{
        opacity: 0,
        scale: 1.5,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: {
          duration: 2,
          ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
        },
      }}
      className={`absolute inset-0 overflow-hidden ${containerClassName}`}
    >
      <div
        ref={containerRef}
        style={containerStyle}
        className="absolute inset-0 transition-opacity duration-500"
      />
    </motion.div>
  );
};

export default AnimatedGradientBackground;
