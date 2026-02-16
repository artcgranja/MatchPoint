"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Globe, Server, Bot, FileCode2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/builder/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), template }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to create project (${res.status})`);
      }

      const project = await res.json();
      onOpenChange(false);
      setName("");
      setError(null);
      router.push(`/builder/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Choose a template and give your project a name.
          </DialogDescription>
        </DialogHeader>

        {/* Name input */}
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="w-full rounded-lg border border-border bg-background-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-highlight focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate();
            }}
          />
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-2 gap-3">
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

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleCreate()}
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
      </DialogContent>
    </Dialog>
  );
}
