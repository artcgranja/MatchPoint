"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/glass-card";
import type { AIAnalysis } from "@/types";

interface AIAnalysisPanelProps {
  analysis: AIAnalysis;
}

export function AIAnalysisPanel({ analysis }: AIAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <GlassCard>
      <h2 className="text-lg font-semibold mb-4">AI Analysis</h2>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="overview" className="mt-4 space-y-3">
              <p className="text-sm text-foreground-muted leading-relaxed">
                {analysis.synergySummary}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-sage/10 p-3">
                  <p className="text-sm font-medium text-sage">
                    {analysis.strengths.length} Strengths
                  </p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-3">
                  <p className="text-sm font-medium text-destructive">
                    {analysis.risks.length} Risks
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="strengths" className="mt-4">
              <ul className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-lg bg-sage/5 p-3 text-sm"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                    {s}
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="risks" className="mt-4">
              <ul className="space-y-2">
                {analysis.risks.map((r, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-lg bg-destructive/5 p-3 text-sm"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    {r}
                  </li>
                ))}
                {analysis.weaknesses.map((w, i) => (
                  <li
                    key={`w-${i}`}
                    className="flex gap-2 rounded-lg bg-destructive/5 p-3 text-sm"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {w}
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="opportunities" className="mt-4">
              <ul className="space-y-2">
                {analysis.opportunities.map((o, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-lg bg-highlight/5 p-3 text-sm"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" />
                    {o}
                  </li>
                ))}
              </ul>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </GlassCard>
  );
}
