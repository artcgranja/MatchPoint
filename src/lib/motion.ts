import type { Variants } from "motion/react";

export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const durations = {
  slideUp: 0.8,
  fadeIn: 0.6,
  scaleIn: 0.5,
} as const;

export const staggerDelays = {
  fast: 0.1,
  medium: 0.15,
  slow: 0.2,
} as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.fadeIn,
      ease: EASE_OUT_EXPO,
    },
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slideUp,
      ease: EASE_OUT_EXPO,
    },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.scaleIn,
      ease: EASE_OUT_EXPO,
    },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: staggerDelays.medium } },
};
