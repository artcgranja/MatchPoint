"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, FolderOpen, Clock, Trash2, Globe, Server, Bot, FileCode2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { NewProjectDialog } from "./new-project-dialog";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cardStagger, cardEntrance } from "@/lib/motion";
import type { BuilderProject } from "@/types/builder";

/**
 * Formats a date string to relative time (e.g. "2h ago", "3d ago").
 */
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

const templateConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; iconBg: string }
> = {
  nextjs_webapp: {
    label: "Next.js",
    icon: Globe,
    iconBg: "bg-highlight/10 text-highlight",
  },
  python_fastapi: {
    label: "FastAPI",
    icon: Server,
    iconBg: "bg-sage/10 text-sage",
  },
  agent_workflow: {
    label: "AI Agent",
    icon: Bot,
    iconBg: "bg-purple-500/10 text-purple-400",
  },
  blank: {
    label: "Blank",
    icon: FileCode2,
    iconBg: "bg-foreground-muted/10 text-foreground-muted",
  },
};

function getTemplateConfig(template: string) {
  return templateConfig[template] ?? {
    label: template,
    icon: FileCode2,
    iconBg: "bg-foreground-muted/10 text-foreground-muted",
  };
}

export function ProjectsList() {
  const t = useTranslations("Builder");
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

    try {
      const res = await fetch(`/api/v1/builder/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      fetch("/api/v1/builder/projects")
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(setProjects)
        .catch(() => {});
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      <SectionHeader
        title={t("title")}
        description={t("description")}
        action={
          <Button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("newProject")}
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t("noProjects")}
          description={t("noProjectsHint")}
          action={
            <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("newProject")}
            </Button>
          }
        />
      ) : (
        <motion.div
          variants={cardStagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project) => {
            const config = getTemplateConfig(project.template);
            const Icon = config.icon;
            return (
              <motion.div key={project.id} variants={cardEntrance}>
                <Link
                  href={`/builder/${project.id}`}
                  className={cn(
                    "group relative flex flex-col rounded-xl border border-border-highlight bg-background-tertiary p-4 transition-colors duration-200",
                    "hover:border-border-hover hover:bg-background-secondary"
                  )}
                >
                  {/* Header: icon + title + delete */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                          config.iconBg
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="font-medium text-sm truncate text-foreground">
                        {project.name}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="shrink-0 rounded-md p-1 text-foreground-muted/0 transition-colors group-hover:text-foreground-muted hover:!text-destructive"
                      aria-label="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="mt-2 text-xs text-foreground-muted leading-relaxed line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Footer: template badge + timestamp */}
                  <div className="mt-auto flex items-center gap-2 pt-3 border-t border-border/40">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-medium border border-border",
                        "bg-surface-elevated text-foreground-muted"
                      )}
                    >
                      {config.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-foreground-muted/60">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(project.lastOpenedAt)}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
