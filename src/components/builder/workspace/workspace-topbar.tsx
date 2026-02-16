"use client";

import { ArrowLeft, MessageSquare, Eye, EyeOff, Github } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useBuilderStore } from "@/stores/builder-store";
import { cn } from "@/lib/utils";
import type { BuilderProject } from "@/types/builder";

interface WorkspaceTopbarProps {
  project: BuilderProject;
  onToggleChat?: () => void;
}

export function WorkspaceTopbar({ project, onToggleChat }: WorkspaceTopbarProps) {
  const chatOpen = useBuilderStore((s) => s.chatOpen);
  const previewUrl = useBuilderStore((s) => s.previewUrl);
  const setPreviewUrl = useBuilderStore((s) => s.setPreviewUrl);

  return (
    <header className="flex h-11 items-center justify-between border-b border-border bg-background-secondary/50 px-3">
      <div className="flex items-center gap-2">
        <Link
          href="/builder"
          className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-medium">{project.name}</span>
        <span className="rounded-md bg-background-secondary px-1.5 py-0.5 text-xs text-foreground-muted">
          {project.template.replace(/_/g, " ")}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Toggle preview */}
        <button
          onClick={() => setPreviewUrl(previewUrl ? null : "")}
          className={cn(
            "rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground",
            previewUrl !== null && "text-highlight"
          )}
          title={previewUrl !== null ? "Hide preview" : "Show preview"}
        >
          {previewUrl !== null ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>

        {/* GitHub */}
        {project.githubRepoUrl ? (
          <a
            href={project.githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </a>
        ) : (
          <button
            className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
            title="Push to GitHub"
          >
            <Github className="h-4 w-4" />
          </button>
        )}

        {/* Toggle chat */}
        <button
          onClick={onToggleChat}
          className={cn(
            "rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground",
            chatOpen && "text-highlight"
          )}
          title={chatOpen ? "Hide chat" : "Show chat"}
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
