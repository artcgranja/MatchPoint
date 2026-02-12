export type PipelineStatus = "idle" | "running" | "complete" | "error";

export type AgentName = "Analysis" | "Scout";

export type SessionStage = "discovery" | "analysis" | "scout" | "complete" | "advising";

export interface PipelineStage {
  id: string;
  name: AgentName;
  description: string;
  status: PipelineStatus;
  progress: number;
  message: string;
}

export interface StartupCard {
  id: number;
  name: string;
  oneLiner: string;
  whyRelevant: string;
  industries: string[];
  tags: string[];
  batch: string;
  location: string;
  website: string;
  ycUrl: string;
}

export interface DiscoveryMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "cards" | "stage-update";
  cards?: StartupCard[];
  createdAt?: string;
}

export interface SearchExecutionSummary {
  id: string;
  status: PipelineStatus;
  resultCount: number;
  scoutSummary: string | null;
  productDocument: string | null;
  cards: StartupCard[];
  orchestratorMessages: { id: string; role: string; content: string; createdAt: string }[];
}

export interface DiscoverySession {
  id: string;
  title?: string | null;
  currentStage: SessionStage;
  isComplete: boolean;
  needSummary?: Record<string, unknown>;
  messages: DiscoveryMessage[];
  searchExecution?: SearchExecutionSummary | null;
}

export type BizDevPlanStatus = "idle" | "thinking" | "writing" | "complete" | "confirmed";

export type AgentPanelTab = "analysis" | "scout";
export type ScoutStatus = "idle" | "searching" | "complete" | "error";

export interface ToolCallEvent {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  status: "running" | "complete" | "error";
  resultSummary?: string;
  timestamp: number;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  compactView: boolean;
}
