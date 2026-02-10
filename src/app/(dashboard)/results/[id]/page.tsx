import { notFound } from "next/navigation";
import { getStartupById } from "@/lib/mock-data";
import { StartupHeader } from "@/components/profile/startup-header";
import { AIAnalysisPanel } from "@/components/profile/ai-analysis-panel";
import { StartupRadar } from "@/components/profile/startup-radar";
import { TeamSection } from "@/components/profile/team-section";
import { MetricsPanel } from "@/components/profile/metrics-panel";
import { FundingTimeline } from "@/components/profile/funding-timeline";

export default async function StartupProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const startup = await getStartupById(id);

  if (!startup) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <StartupHeader startup={startup} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AIAnalysisPanel analysis={startup.aiAnalysis} />
        <StartupRadar
          radarScores={startup.aiAnalysis.radarScores}
          name={startup.name}
        />
      </div>

      <MetricsPanel metrics={startup.metrics} />
      <FundingTimeline
        currentStage={startup.fundingStage}
        totalFunding={startup.totalFunding}
      />
      <TeamSection team={startup.team} />
    </div>
  );
}
