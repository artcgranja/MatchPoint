"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { staggerContainer } from "@/lib/motion";
import type { Variants } from "motion/react";

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}

export function StaggerContainer({
  children,
  className,
  variants = staggerContainer,
}: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
