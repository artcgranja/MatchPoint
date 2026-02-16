"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Globe, Server, Bot, FileCode2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectTemplate } from "@/types/builder";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const templates: {
  id: ProjectTemplate;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "nextjs_webapp",
    name: "Next.js Web App",
    description: "Full-stack web app with React, Tailwind, and App Router",
    icon: Globe,
  },
  {
    id: "python_fastapi",
    name: "Python FastAPI",
    description: "Python backend with FastAPI, uvicorn, and Pydantic",
    icon: Server,
  },
  {
    id: "agent_workflow",
    name: "AI Agent Workflow",
    description: "Python agent workflow using the Anthropic SDK",
    icon: Bot,
  },
  {
    id: "blank",
    name: "Blank Project",
    description: "Empty sandbox with Node.js and Python pre-installed",
    icon: FileCode2,
  },
];

export function NewProjectDialog({
  open,
  onOpenChange,
}: NewProjectDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<ProjectTemplate>("nextjs_webapp");
  const [creating, setCreating] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);

    try {
      const res = await fetch("/api/v1/builder/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), template }),
      });

      if (!res.ok) throw new Error("Failed to create project");

      const project = await res.json();
      onOpenChange(false);
      setName("");
      router.push(`/builder/${project.id}`);
    } catch {
      // Handle error silently
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">New Project</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Choose a template and give your project a name.
        </p>

        {/* Name input */}
        <div className="mt-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="w-full rounded-lg border border-border bg-background-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-highlight focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
        </div>

        {/* Template grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={cn(
                "flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                template === t.id
                  ? "border-highlight bg-highlight/5"
                  : "border-border hover:border-border/80 hover:bg-background-secondary/30"
              )}
            >
              <t.icon
                className={cn(
                  "mb-2 h-5 w-5",
                  template === t.id
                    ? "text-highlight"
                    : "text-foreground-muted"
                )}
              />
              <span className="text-sm font-medium">{t.name}</span>
              <span className="mt-0.5 text-xs text-foreground-muted line-clamp-2">
                {t.description}
              </span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
              name.trim() && !creating
                ? "bg-highlight hover:bg-highlight/90"
                : "bg-highlight/40 cursor-not-allowed"
            )}
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            {creating ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
