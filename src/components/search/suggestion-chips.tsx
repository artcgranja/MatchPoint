"use client";

import { motion } from "motion/react";
import { Building2, Heart, Shield, Truck, GraduationCap, Leaf } from "lucide-react";
import { staggerContainer, fadeIn } from "@/lib/motion";

const suggestions = [
  {
    icon: Building2,
    label: "Varejo + IA",
    text: "Somos uma rede de varejo com 200 lojas e precisamos de automação com IA",
  },
  {
    icon: Heart,
    label: "Telemedicina",
    text: "Hospital de médio porte buscando soluções de telemedicina",
  },
  {
    icon: Shield,
    label: "Antifraude",
    text: "Fintech precisando de solução antifraude em tempo real",
  },
  {
    icon: Truck,
    label: "Logística",
    text: "Empresa de logística buscando otimização de rotas com IA",
  },
  {
    icon: GraduationCap,
    label: "Educação",
    text: "Rede de educação precisando de plataforma de ensino adaptativo",
  },
  {
    icon: Leaf,
    label: "Sustentabilidade",
    text: "Indústria buscando soluções de gestão energética e ESG",
  },
];

interface SuggestionChipsProps {
  onSelect?: (suggestion: string) => void;
  variant?: "default" | "compact";
  disabled?: boolean;
}

export function SuggestionChips({ onSelect, variant = "default", disabled }: SuggestionChipsProps) {
  if (variant === "compact") {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap items-center justify-center gap-2"
      >
        {suggestions.map((s) => (
          <motion.button
            key={s.label}
            variants={fadeIn}
            onClick={() => onSelect?.(s.text)}
            disabled={disabled}
            className="group flex items-center gap-2 rounded-full border border-border-base bg-surface px-3 py-1.5 text-xs font-medium text-foreground-muted transition-all hover:border-highlight/30 hover:text-foreground hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-50"
          >
            <s.icon className="h-3 w-3" />
            {s.label}
          </motion.button>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
    >
      {suggestions.map((s) => (
        <motion.button
          key={s.label}
          variants={fadeIn}
          onClick={() => onSelect?.(s.text)}
          disabled={disabled}
          className="group flex items-start gap-3 rounded-xl border border-border bg-background-secondary/30 p-3 text-left transition-all hover:border-highlight/30 hover:bg-highlight/5 disabled:pointer-events-none disabled:opacity-50"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-highlight/10 text-highlight transition-colors group-hover:bg-highlight/20">
            <s.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{s.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted line-clamp-2">
              {s.text}
            </p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
