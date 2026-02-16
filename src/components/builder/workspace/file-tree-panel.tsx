"use client";

import { useEffect, useCallback, useState } from "react";
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/stores/builder-store";
import type { FileNode } from "@/types/builder";

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return <File className="h-3.5 w-3.5 text-blue-400" />;
    case "js":
    case "jsx":
      return <File className="h-3.5 w-3.5 text-yellow-400" />;
    case "py":
      return <File className="h-3.5 w-3.5 text-green-400" />;
    case "json":
      return <File className="h-3.5 w-3.5 text-amber-400" />;
    case "css":
    case "scss":
      return <File className="h-3.5 w-3.5 text-purple-400" />;
    case "md":
    case "mdx":
      return <File className="h-3.5 w-3.5 text-gray-400" />;
    default:
      return <File className="h-3.5 w-3.5 text-foreground-muted" />;
  }
}

function FileTreeNode({
  node,
  depth = 0,
  expandedDirs,
  toggleDir,
  activeFile,
  openFile,
}: {
  node: FileNode;
  depth?: number;
  expandedDirs: Set<string>;
  toggleDir: (path: string) => void;
  activeFile: string | null;
  openFile: (path: string) => void;
}) {
  const isExpanded = expandedDirs.has(node.path);
  const isActive = node.path === activeFile;

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={() => toggleDir(node.path)}
          className={cn(
            "flex w-full items-center gap-1 rounded-sm px-1 py-0.5 text-xs transition-colors hover:bg-background-secondary",
            "text-foreground-muted hover:text-foreground"
          )}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-highlight/70" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-highlight/70" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedDirs={expandedDirs}
                toggleDir={toggleDir}
                activeFile={activeFile}
                openFile={openFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => openFile(node.path)}
      className={cn(
        "flex w-full items-center gap-1 rounded-sm px-1 py-0.5 text-xs transition-colors",
        isActive
          ? "bg-highlight/10 text-highlight"
          : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
      )}
      style={{ paddingLeft: `${depth * 12 + 16}px` }}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileTreePanel() {
  const fileTree = useBuilderStore((s) => s.fileTree);
  const projectId = useBuilderStore((s) => s.projectId);
  const sandboxReady = useBuilderStore((s) => s.sandboxReady);
  const setFileTree = useBuilderStore((s) => s.setFileTree);
  const activeFile = useBuilderStore((s) => s.activeFile);
  const openFile = useBuilderStore((s) => s.openFile);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const fetchTree = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(
        `/api/v1/builder/projects/${projectId}/files?path=/home/user/app`
      );
      if (res.ok) {
        const data = await res.json();
        setFileTree(data);
      }
    } catch {
      // Ignore errors
    }
  }, [projectId, setFileTree]);

  useEffect(() => {
    if (sandboxReady) fetchTree();
  }, [sandboxReady, fetchTree]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
          Files
        </span>
        <button
          onClick={fetchTree}
          className="rounded-sm p-0.5 text-foreground-muted transition-colors hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-foreground-muted">
            {sandboxReady ? "No files yet" : "Connecting to sandbox..."}
          </p>
        ) : (
          fileTree.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              expandedDirs={expandedDirs}
              toggleDir={toggleDir}
              activeFile={activeFile}
              openFile={openFile}
            />
          ))
        )}
      </div>
    </div>
  );
}
