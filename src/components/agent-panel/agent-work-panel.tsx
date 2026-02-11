"use client";

import { Brain, X, Check, Loader2, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { AnalysisTab } from "./analysis-tab";
import { ScoutTab } from "./scout-tab";
import type { AgentPanelTab } from "@/types";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface AgentWorkPanelProps {
  onConfirm: () => void;
  onClose: () => void;
}

function AnalysisStatusDot() {
  const { analysisStatus } = useAgentPanelStore();
  if (analysisStatus === "idle") return null;

  if (analysisStatus === "complete" || analysisStatus === "confirmed") {
    return <Check className="h-3 w-3 text-sage" />;
  }
  return <Loader2 className="h-3 w-3 animate-spin text-highlight" />;
}

function ScoutStatusDot() {
  const { scoutStatus, cards } = useAgentPanelStore();
  if (scoutStatus === "idle") return null;

  if (scoutStatus === "complete") {
    return (
      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sage/20 px-1 text-[9px] font-bold text-sage">
        {cards.length}
      </span>
    );
  }
  if (scoutStatus === "searching") {
    return <Loader2 className="h-3 w-3 animate-spin text-highlight" />;
  }
  return null;
}

export function AgentWorkPanel({ onConfirm, onClose }: AgentWorkPanelProps) {
  const { activeTab, setActiveTab } = useAgentPanelStore();

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-border bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-highlight/10">
            <Brain className="h-4 w-4 text-highlight" />
          </div>
          <h3 className="text-sm font-semibold">Painel de Agentes</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AgentPanelTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList variant="line" className="w-full shrink-0 border-b border-border px-4">
          <TabsTrigger value="analysis" className="gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            Analise
            <AnalysisStatusDot />
          </TabsTrigger>
          <TabsTrigger value="scout" className="gap-1.5">
            <Rocket className="h-3.5 w-3.5" />
            Scout
            <ScoutStatusDot />
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: EASE_OUT_EXPO }}
            className="min-h-0 flex-1"
          >
            <TabsContent value="analysis" className="h-full">
              <AnalysisTab onConfirm={onConfirm} />
            </TabsContent>
            <TabsContent value="scout" className="h-full">
              <ScoutTab />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
