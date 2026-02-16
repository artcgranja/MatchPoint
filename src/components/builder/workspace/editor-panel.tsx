"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useBuilderStore } from "@/stores/builder-store";
import { EditorTabs } from "./editor-tabs";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
      Loading editor...
    </div>
  ),
});

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sh: "shell",
    bash: "shell",
    env: "ini",
    prisma: "prisma",
    sql: "sql",
    xml: "xml",
    svg: "xml",
  };
  return map[ext ?? ""] ?? "plaintext";
}

export function EditorPanel() {
  const activeFile = useBuilderStore((s) => s.activeFile);
  const openFiles = useBuilderStore((s) => s.openFiles);
  const projectId = useBuilderStore((s) => s.projectId);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch file content when active file changes
  useEffect(() => {
    if (!activeFile || !projectId) {
      setContent("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/v1/builder/projects/${projectId}/files/content?path=${encodeURIComponent(activeFile)}`,
          { signal: controller.signal }
        );
        if (cancelled) return;
        if (!res.ok) throw new Error("Failed to fetch file");
        const text = await res.text();
        if (!cancelled) setContent(text);
      } catch {
        if (!cancelled) setContent("// Failed to load file");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      // Cancel any pending save debounce to prevent cross-file writes
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [activeFile, projectId]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Debounced save
  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!value || !activeFile || !projectId) return;
      setContent(value);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        fetch(
          `/api/v1/builder/projects/${projectId}/files/content?path=${encodeURIComponent(activeFile)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "text/plain" },
            body: value,
          }
        ).catch(() => {
          // Silent fail on save
        });
      }, 1000);
    },
    [activeFile, projectId]
  );

  if (openFiles.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-sm text-foreground-muted">
        <p>Open a file from the explorer to start editing</p>
        <p className="mt-1 text-xs">or ask the AI to create files for you</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <EditorTabs />
      <div className="min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
            Loading...
          </div>
        ) : (
          activeFile && (
            <MonacoEditor
              height="100%"
              language={getLanguage(activeFile)}
              path={activeFile}
              value={content}
              onChange={handleChange}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'Fira Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                padding: { top: 8 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
              }}
            />
          )
        )}
      </div>
    </div>
  );
}
