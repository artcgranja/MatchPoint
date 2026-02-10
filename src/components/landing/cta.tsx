"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { slideUp } from "@/lib/motion";

export function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to find your match?
          </h2>
          <p className="mt-4 text-foreground-muted max-w-lg mx-auto">
            Start by describing your business challenge and let our AI agents
            do the rest.
          </p>
          <div className="mt-8 relative inline-block">
            <div className="absolute -inset-1 rounded-lg bg-highlight/20 blur-lg" />
            <Button asChild size="lg" className="relative gap-2">
              <Link href="/search">
                Get Started Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
