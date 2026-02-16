"use client";

import { useEffect, useState } from "react";
import { Plus, FolderOpen, Clock, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { NewProjectDialog } from "./new-project-dialog";
import type { BuilderProject } from "@/types/builder";

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const templateLabels: Record<string, string> = {
  nextjs_webapp: "Next.js",
  python_fastapi: "FastAPI",
  agent_workflow: "AI Agent",
  blank: "Blank",
};

export function ProjectsList() {
  const [projects, setProjects] = useState<BuilderProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/v1/builder/projects")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this project? This cannot be undone.")) return;

    await fetch(`/api/v1/builder/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Build web apps, APIs, and AI agents with an AI-powered workspace.
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-highlight px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-highlight/90"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border bg-background-secondary/30"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background-secondary/20 py-16">
          <FolderOpen className="mb-3 h-10 w-10 text-foreground-muted/30" />
          <p className="text-sm text-foreground-muted">No projects yet</p>
          <p className="mt-1 text-xs text-foreground-muted/60">
            Create your first project to get started
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-4 flex items-center gap-2 rounded-lg bg-highlight px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-highlight/90"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/builder/${project.id}`}
              className={cn(
                "group relative flex flex-col rounded-xl border border-border bg-background-secondary/20 p-4 transition-all",
                "hover:border-highlight/30 hover:bg-background-secondary/40"
              )}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sm">{project.name}</h3>
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  className="rounded-md p-1 text-foreground-muted/0 transition-colors group-hover:text-foreground-muted hover:!text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {project.description && (
                <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="mt-auto flex items-center gap-2 pt-3">
                <span className="rounded-md bg-background-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted">
                  {templateLabels[project.template] ?? project.template}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-foreground-muted/60">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(project.lastOpenedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
