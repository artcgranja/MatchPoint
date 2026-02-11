export type FundingStage =
  | "Pre-Seed"
  | "Seed"
  | "Series A"
  | "Series B"
  | "Series C"
  | "Series D+"
  | "IPO";

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  linkedin?: string;
}

export interface StartupMetrics {
  revenue: number;
  revenueGrowth: number;
  customers: number;
  nps: number;
  burnRate: number;
  runway: number;
}

export interface Startup {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  description: string;
  website: string;
  founded: number;
  employees: number;
  location: string;
  industries: string[];
  technologies: string[];
  fundingStage: FundingStage;
  totalFunding: number;
  team: TeamMember[];
  metrics: StartupMetrics;
}

export type PipelineStatus = "idle" | "running" | "complete" | "error";

export type AgentName = "Analysis" | "Scout";

export type SessionStage = "discovery" | "analysis" | "scout" | "complete";

export interface PipelineStage {
  id: string;
  name: AgentName;
  description: string;
  status: PipelineStatus;
  progress: number;
  message: string;
}

export interface StartupCard {
  id: string;
  name: string;
  tagline: string;
  description: string;
  whyRelevant: string;
  industries: string[];
  fundingStage: string;
  location: string;
}

export interface DiscoveryMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "cards" | "stage-update";
  cards?: StartupCard[];
  createdAt?: string;
}

export interface DiscoverySession {
  id: string;
  currentStage: SessionStage;
  isComplete: boolean;
  needSummary?: Record<string, unknown>;
  messages: DiscoveryMessage[];
}

export type BizDevPlanStatus = "idle" | "thinking" | "writing" | "complete" | "confirmed";

export interface UserSettings {
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  compactView: boolean;
}
