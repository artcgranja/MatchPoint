"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import type { Variants } from "motion/react";
import { slideUp } from "@/lib/motion";

interface AnimatedSectionProps {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
}

export function AnimatedSection({
  children,
  variants = slideUp,
  className,
  delay = 0,
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  );
}
