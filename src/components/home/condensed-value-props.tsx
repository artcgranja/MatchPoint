"use client";

import { useRef } from "react";
import { motion, useMotionValue } from "motion/react";
import { Brain, Target, Zap } from "lucide-react";
import { slideUp, staggerContainer } from "@/lib/motion";

const features = [
  {
    icon: Brain,
    title: "Analise com IA",
    description:
      "Agentes especializados conduzem uma conversa natural para entender profundamente seu desafio de negocios, gerando um documento de produto detalhado.",
    stats: "3 agentes",
    detail: "Discovery + Analysis + Scout",
  },
  {
    icon: Target,
    title: "Matching de Precisao",
    description:
      "Cruzamos mais de 50 dimensoes — setor, tecnologia, estagio, modelo de negocio, localizacao — para encontrar startups que realmente se encaixam.",
    stats: "50+ dimensoes",
    detail: "Filtros multi-criterio",
  },
  {
    icon: Zap,
    title: "Pipeline em Tempo Real",
    description:
      "Acompanhe todo o processo ao vivo: da conversa inicial ate os resultados finais, com transparencia total sobre o raciocinio dos agentes.",
    stats: "< 5 min",
    detail: "Da conversa ao resultado",
  },
];

function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(((e.clientX - rect.left) / rect.width) * 100);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 100);
    ref.current?.style.setProperty("--mouse-x", `${mouseX.get()}%`);
    ref.current?.style.setProperty("--mouse-y", `${mouseY.get()}%`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`spotlight-card shine-sweep glass rounded-2xl p-6 transition-all duration-300 hover:border-highlight/20 ${className}`}
    >
      {children}
    </div>
  );
}

export function CondensedValueProps() {
  return (
    <section className="relative py-24">
      {/* Ambient glow */}
      <div className="ambient-glow-blue absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Section header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mb-16 text-center"
        >
          <motion.p
            variants={slideUp}
            className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-highlight"
          >
            Como funciona
          </motion.p>
          <motion.h2
            variants={slideUp}
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Inteligencia artificial a servico do seu{" "}
            <span className="text-gradient">crescimento</span>
          </motion.h2>
          <motion.p
            variants={slideUp}
            className="mx-auto mt-4 max-w-2xl text-base text-foreground-muted"
          >
            Nosso pipeline de agentes trabalha em conjunto para encontrar e
            avaliar startups que resolvem o seu desafio.
          </motion.p>
        </motion.div>

        {/* Feature cards grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {features.map(({ icon: Icon, title, description, stats, detail }) => (
            <motion.div key={title} variants={slideUp}>
              <SpotlightCard>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-highlight/10 text-highlight">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold text-highlight">
                      {stats}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      {detail}
                    </p>
                  </div>
                </div>
                <h3 className="mb-2 text-base font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-foreground-muted">
                  {description}
                </p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
