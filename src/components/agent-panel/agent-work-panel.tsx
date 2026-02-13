"use client";

import { Brain, Check, Loader2, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { AnalysisTab } from "./analysis-tab";
import { ScoutTab } from "./scout-tab";
import type { AgentPanelTab } from "@/types";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface AgentWorkPanelProps {
  onConfirm: () => void;
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

export function AgentWorkPanel({ onConfirm }: AgentWorkPanelProps) {
  const { activeTab, setActiveTab } = useAgentPanelStore();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AgentPanelTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="shrink-0 border-b border-border px-3 pt-1">
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="analysis" className="gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              Análise
              <AnalysisStatusDot />
            </TabsTrigger>
            <TabsTrigger value="scout" className="gap-1.5">
              <Rocket className="h-3.5 w-3.5" />
              Scout
              <ScoutStatusDot />
            </TabsTrigger>
          </TabsList>
        </div>

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
