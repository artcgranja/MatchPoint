"use client";

import { motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import { slideUp, staggerContainer } from "@/lib/motion";

export function CTASection() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="relative py-24">
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={slideUp}
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Pronto para encontrar seu{" "}
            <span className="text-gradient">match</span>?
          </motion.h2>
          <motion.p
            variants={slideUp}
            className="mx-auto mt-4 max-w-lg text-base text-foreground-muted"
          >
            Comece uma conversa e deixe nossos agentes trabalharem para voce.
            Sem formularios, sem espera.
          </motion.p>
          <motion.div variants={slideUp} className="mt-8">
            <button
              onClick={scrollToTop}
              className="group inline-flex items-center gap-3 rounded-full bg-highlight px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:bg-highlight-dim hover:scale-105 active:scale-95 hover:shadow-[0_0_24px_rgba(59,130,246,0.3)]"
            >
              Comecar Agora
              <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
