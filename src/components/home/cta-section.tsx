import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { slideUp, staggerContainer } from "@/lib/motion";
import {
  AnimateOnScroll,
  AnimateOnScrollItem,
} from "@/components/ui/animate-on-scroll";

export function CTASection() {
  return (
    <section className="relative py-24" aria-label="Começar agora">
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <AnimateOnScroll variants={staggerContainer}>
          <AnimateOnScrollItem variants={slideUp}>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Pronto para encontrar seu{" "}
              <span className="text-gradient">match</span>?
            </h2>
          </AnimateOnScrollItem>
          <AnimateOnScrollItem variants={slideUp}>
            <p className="mx-auto mt-4 max-w-lg text-base text-foreground-muted">
              Comece uma conversa e deixe nossos agentes trabalharem para você.
              Sem formulários, sem espera.
            </p>
          </AnimateOnScrollItem>
          <AnimateOnScrollItem variants={slideUp}>
            <div className="mt-8">
              <Link
                href="/?login=1"
                className="group inline-flex items-center gap-3 rounded-full bg-highlight px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:bg-highlight-dim hover:scale-105 active:scale-95 hover:shadow-[0_0_24px_rgba(59,130,246,0.3)]"
              >
                Começar Agora
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </AnimateOnScrollItem>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
