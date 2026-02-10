"use client";

import { motion, AnimatePresence } from "motion/react";
import { fadeIn } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={fadeIn}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
