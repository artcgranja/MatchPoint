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

export interface RadarScore {
  dimension: string;
  score: number;
  benchmark: number;
}

export interface AIAnalysis {
  matchScore: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
  synergySummary: string;
  radarScores: RadarScore[];
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
  aiAnalysis: AIAnalysis;
}

export type PipelineStatus = "idle" | "running" | "complete" | "error";

export type AgentName =
  | "Navigator"
  | "Scout"
  | "Analyst"
  | "Matchmaker"
  | "Reporter";

export interface PipelineStage {
  id: string;
  name: AgentName;
  description: string;
  status: PipelineStatus;
  progress: number;
  message: string;
  icon: string;
}

export interface SearchFilters {
  industries: string[];
  fundingStages: FundingStage[];
  locations: string[];
  minMatchScore: number;
  maxEmployeeCount: number;
  technologies: string[];
}

export interface SearchQuery {
  id: string;
  painPoint: string;
  filters: SearchFilters;
  timestamp: string;
  status: PipelineStatus;
  resultCount: number;
}

export interface ComparisonSet {
  id: string;
  startupIds: string[];
  createdAt: string;
}

export interface ReportSection {
  title: string;
  content: string;
  chartType?: "radar" | "bar" | "line";
}

export interface Report {
  id: string;
  title: string;
  searchQueryId: string;
  sections: ReportSection[];
  createdAt: string;
}

export interface ChartConfig {
  type: "radar" | "bar" | "line";
  data: Record<string, unknown>[];
  keys: string[];
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  defaultFilters: Partial<SearchFilters>;
  notificationsEnabled: boolean;
  compactView: boolean;
}

// Discovery / SCOPE conversation types

export type ScopePhase =
  | "situation"
  | "challenge"
  | "objectives"
  | "parameters"
  | "evaluation"
  | "complete";

export interface DiscoveryMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  phase?: ScopePhase;
  createdAt?: string;
}

export interface DiscoverySession {
  id: string;
  currentPhase: ScopePhase;
  isComplete: boolean;
  bizPlan?: Record<string, unknown>;
  messages: DiscoveryMessage[];
}
