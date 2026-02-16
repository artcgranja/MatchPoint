export type BuilderChatMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  type?: "text" | "tool_call" | "file_change" | "command_output" | "thinking";
  metadata?: Record<string, unknown>;
  createdAt?: Date;
};

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
};

export type ProjectTemplate = "nextjs_webapp" | "python_fastapi" | "agent_workflow" | "blank";

export type ProjectStatus = "active" | "paused" | "archived" | "deleted";

export interface BuilderProject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  template: ProjectTemplate;
  sandboxId: string | null;
  githubRepoUrl: string | null;
  githubRepoName: string | null;
  status: ProjectStatus;
  lastOpenedAt: string;
  createdAt: string;
  updatedAt: string;
}
