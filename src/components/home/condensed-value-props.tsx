import { Brain, Target, Zap } from "lucide-react";
import { slideUp, staggerContainer } from "@/lib/motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import {
  AnimateOnScroll,
  AnimateOnScrollItem,
} from "@/components/ui/animate-on-scroll";

const features = [
  {
    icon: Brain,
    title: "Análise com IA",
    description:
      "Agentes especializados conduzem uma conversa natural para entender profundamente seu desafio de negócios, gerando um documento de produto detalhado.",
    stats: "3 agentes",
    detail: "Discovery + Analysis + Scout",
  },
  {
    icon: Target,
    title: "Matching de Precisão",
    description:
      "Cruzamos mais de 50 dimensões — setor, tecnologia, estágio, modelo de negócio, localização — para encontrar startups que realmente se encaixam.",
    stats: "50+ dimensões",
    detail: "Filtros multicritério",
  },
  {
    icon: Zap,
    title: "Pipeline em Tempo Real",
    description:
      "Acompanhe todo o processo ao vivo: da conversa inicial até os resultados finais, com transparência total sobre o raciocínio dos agentes.",
    stats: "< 5 min",
    detail: "Da conversa ao resultado",
  },
];

export function CondensedValueProps() {
  return (
    <section id="como-funciona" className="relative py-24" aria-label="Como funciona">
      {/* Ambient glow */}
      <div className="ambient-glow-blue absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Section header */}
        <AnimateOnScroll variants={staggerContainer} className="mb-16 text-center">
          <AnimateOnScrollItem variants={slideUp}>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-highlight">
              Como funciona
            </p>
          </AnimateOnScrollItem>
          <AnimateOnScrollItem variants={slideUp}>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Inteligência artificial a serviço do seu{" "}
              <span className="text-gradient">crescimento</span>
            </h2>
          </AnimateOnScrollItem>
          <AnimateOnScrollItem variants={slideUp}>
            <p className="mx-auto mt-4 max-w-2xl text-base text-foreground-muted">
              Nosso pipeline de agentes trabalha em conjunto para encontrar e
              avaliar startups que resolvem o seu desafio.
            </p>
          </AnimateOnScrollItem>
        </AnimateOnScroll>

        {/* Feature cards grid */}
        <AnimateOnScroll
          variants={staggerContainer}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {features.map(({ icon: Icon, title, description, stats, detail }) => (
            <AnimateOnScrollItem key={title} variants={slideUp}>
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
            </AnimateOnScrollItem>
          ))}
        </AnimateOnScroll>
      </div>
    </section>
  );
}
