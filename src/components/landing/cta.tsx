"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { slideUp, staggerContainer } from "@/lib/motion";

export function CTA() {
  return (
    <section id="contact" className="relative py-32 overflow-hidden ambient-glow-sage">
      <div className="absolute inset-0 bg-void" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-divider to-transparent" />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="text-center">
            <motion.span
              variants={slideUp}
              className="inline-block font-mono text-xs tracking-[0.3em] text-text-muted mb-4 uppercase"
            >
              Get Started
            </motion.span>

            <motion.h2
              variants={slideUp}
              className="font-display font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight mb-6"
            >
              <span className="text-text">Ready to find </span>
              <span className="text-text-dim">your match?</span>
            </motion.h2>

            <motion.p
              variants={slideUp}
              className="max-w-xl mx-auto text-text-dim text-lg mb-10"
            >
              Start by describing your business challenge and let our AI agents
              do the rest.
            </motion.p>

            <motion.div variants={slideUp}>
              <Link
                href="/search"
                className="group inline-flex items-center gap-3 font-display text-base font-medium px-10 h-14 rounded-full bg-text text-void hover:bg-text/90 transition-all duration-300 hover:scale-105 active:scale-95 hover:ring-4 hover:ring-text/20"
              >
                Get Started Now
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
