import type { QuestionData } from "@/types";

/**
 * Unified SSE payload — the ONLY event type in the system.
 * Replaces both ConductorEvent (state-machine) and PipelineEvent (orchestrator).
 * Every event is sent as a named SSE event: `event: <type>\ndata: {...}\n\n`
 */
export type SsePayload =
  | { type: "text"; agent: string; text: string }
  | { type: "thinking"; agent: string; text: string }
  | { type: "tool_start"; agent: string; toolName: string; toolCallId: string }
  | { type: "tool_call"; agent: string; toolName: string; toolCallId: string; input: Record<string, unknown> }
  | { type: "tool_result"; agent: string; toolName: string; toolCallId: string; resultSummary?: string }
  | { type: "questions"; agent: string; questions: QuestionData[]; context?: string }
  | { type: "stage_update"; agent: string; progress: number; message: string; key?: string; params?: Record<string, string | number> }
  | { type: "done"; agent: string; transition?: string; searchId?: string }
  | { type: "error"; agent: string; message: string }
  | { type: "status"; agent: string; message: string; key?: string; params?: Record<string, string | number> }
  | { type: "pipeline_complete"; agent: string; data: Record<string, unknown> };
