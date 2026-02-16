"use client";

import { useState, useRef, useEffect } from "react";
import {
  Compass,
  ChevronDown,
  FolderOpen,
  Pencil,
  MessageSquare,
  Eye,
  EyeOff,
  Github,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Link } from "@/i18n/navigation";
import { useBuilderStore } from "@/stores/builder-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { BuilderProject } from "@/types/builder";

interface WorkspaceTopbarProps {
  project: BuilderProject;
  onToggleChat?: () => void;
}

const THEME_OPTIONS = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
] as const;

function ThemeControl() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-1 mb-1 flex items-center gap-1 rounded-lg bg-background-secondary/50 p-1">
      {THEME_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setTheme(opt.value);
          }}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md p-1.5 transition-all duration-300",
            theme === opt.value
              ? "bg-highlight/15 text-highlight shadow-[0_0_12px_rgba(59,130,246,0.15)]"
              : "text-foreground-muted/40 hover:text-foreground-muted"
          )}
        >
          <opt.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

export function WorkspaceTopbar({ project, onToggleChat }: WorkspaceTopbarProps) {
  const chatOpen = useBuilderStore((s) => s.chatOpen);
  const previewUrl = useBuilderStore((s) => s.previewUrl);
  const setPreviewUrl = useBuilderStore((s) => s.setPreviewUrl);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleOpenRename = () => {
    setRenameValue(project.name);
    setIsRenameOpen(true);
  };

  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === project.name) {
      setIsRenameOpen(false);
      return;
    }
    // TODO: call rename API
    setIsRenameOpen(false);
  };

  useEffect(() => {
    if (isRenameOpen) {
      setTimeout(() => renameInputRef.current?.select(), 50);
    }
  }, [isRenameOpen]);

  return (
    <>
      <header className="flex h-11 items-center justify-between border-b border-border px-4">
        {/* Left: Compass + Project name dropdown */}
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 shrink-0 text-highlight" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex max-w-[200px] items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-background-secondary">
                <span className="truncate">{project.name}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/builder">
                  <FolderOpen className="h-4 w-4" />
                  Back to Projects
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenRename}>
                <Pencil className="h-4 w-4" />
                Rename Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ThemeControl />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center: Template badge */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="rounded-md bg-background-secondary px-2 py-0.5 text-xs text-foreground-muted">
            {project.template.replace(/_/g, " ")}
          </span>
        </div>

        {/* Right: Preview toggle, GitHub, Chat toggle */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-foreground-muted hover:text-foreground"
            onClick={() => setPreviewUrl(previewUrl ? null : "")}
            title={previewUrl !== null ? "Hide preview" : "Show preview"}
          >
            {previewUrl !== null ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>

          {project.githubRepoUrl ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-foreground-muted hover:text-foreground"
              asChild
            >
              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-foreground-muted hover:text-foreground"
              title="Push to GitHub"
            >
              <Github className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 text-foreground-muted hover:text-foreground",
              chatOpen && "text-highlight"
            )}
            onClick={onToggleChat}
            title={chatOpen ? "Hide chat" : "Show chat"}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Rename dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          <Input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
            maxLength={120}
            placeholder="Project name"
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRename}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
