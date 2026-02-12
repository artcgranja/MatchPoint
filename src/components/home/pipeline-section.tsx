import { MessageSquare, FileText, Rocket } from "lucide-react";
import { slideUp, staggerContainer } from "@/lib/motion";
import {
  AnimateOnScroll,
  AnimateOnScrollItem,
} from "@/components/ui/animate-on-scroll";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Discovery",
    model: "Sonnet 4.5",
    description:
      "Converse naturalmente com nosso agente Navigator. Ele entende seu contexto, problema e objetivos sem formulários rígidos.",
    color: "text-highlight",
    bg: "bg-highlight/10",
    border: "border-highlight/20",
  },
  {
    number: "02",
    icon: FileText,
    title: "Analysis",
    model: "Opus 4.6",
    description:
      "O agente BizDev analisa toda a conversa e produz um documento de produto estruturado com suas necessidades mapeadas.",
    color: "text-sage",
    bg: "bg-sage/10",
    border: "border-sage/20",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Scout",
    model: "Haiku 4.5",
    description:
      "O agente Scout busca em nossa base de startups, avalia cada candidata e retorna os melhores matches com justificativas.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
];

export function PipelineSection() {
  return (
    <section id="pipeline" className="relative py-24" aria-label="Pipeline">
      {/* Ambient sage glow */}
      <div
        className="ambient-glow-sage absolute inset-0"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Section header */}
        <AnimateOnScroll variants={staggerContainer} className="mb-16 text-center">
          <AnimateOnScrollItem variants={slideUp}>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-sage">
              Pipeline
            </p>
          </AnimateOnScrollItem>
          <AnimateOnScrollItem variants={slideUp}>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Três etapas,{" "}
              <span className="text-gradient">uma conversa</span>
            </h2>
          </AnimateOnScrollItem>
          <AnimateOnScrollItem variants={slideUp}>
            <p className="mx-auto mt-4 max-w-2xl text-base text-foreground-muted">
              Cada etapa usa um modelo Claude especializado. Você acompanha
              tudo em tempo real no painel lateral.
            </p>
          </AnimateOnScrollItem>
        </AnimateOnScroll>

        {/* Pipeline steps */}
        <AnimateOnScroll variants={staggerContainer} className="relative">
          {/* Connecting line */}
          <div className="absolute left-6 top-0 bottom-0 hidden w-px bg-gradient-to-b from-highlight via-sage to-amber-400/40 md:left-1/2 md:block" />

          <div className="flex flex-col gap-12 md:gap-16">
            {steps.map((step, i) => (
              <AnimateOnScrollItem
                key={step.number}
                variants={slideUp}
                className={`relative flex flex-col gap-6 md:flex-row md:items-center ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-6 top-0 hidden -translate-x-1/2 md:left-1/2 md:block">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${step.border} ${step.bg}`}
                  >
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                  </div>
                </div>

                {/* Content card */}
                <div
                  className={`glass shine-sweep rounded-2xl p-6 md:w-[calc(50%-3rem)] ${
                    i % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${step.bg} md:hidden`}
                    >
                      <step.icon className={`h-4 w-4 ${step.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground-muted">
                          {step.number}
                        </span>
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                      </div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-foreground-muted">
                        Claude {step.model}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground-muted">
                    {step.description}
                  </p>
                </div>
              </AnimateOnScrollItem>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
