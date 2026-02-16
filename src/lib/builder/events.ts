export type BuilderSsePayload =
  | { type: "text"; text: string }
  | { type: "thinking"; text: string }
  | { type: "tool_start"; tool: string; id: string }
  | { type: "tool_result"; tool: string; id: string; output: string }
  | { type: "file_changed"; path: string; action: "created" | "modified" | "deleted" }
  | { type: "command_output"; output: string; exitCode?: number }
  | { type: "preview_ready"; url: string; port: number }
  | { type: "done" }
  | { type: "error"; message: string };
