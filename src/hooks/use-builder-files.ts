"use client";

import { useCallback } from "react";
import { useBuilderStore } from "@/stores/builder-store";
import type { FileNode } from "@/types/builder";

export function useBuilderFiles() {
  const projectId = useBuilderStore((s) => s.projectId);
  const setFileTree = useBuilderStore((s) => s.setFileTree);

  const fetchTree = useCallback(
    async (path = "/home/user/app") => {
      if (!projectId) return;
      const res = await fetch(
        `/api/v1/builder/projects/${projectId}/files?path=${encodeURIComponent(path)}`
      );
      if (res.ok) {
        const data: FileNode[] = await res.json();
        setFileTree(data);
      }
    },
    [projectId, setFileTree]
  );

  const readFile = useCallback(
    async (path: string): Promise<string | null> => {
      if (!projectId) return null;
      const res = await fetch(
        `/api/v1/builder/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`
      );
      if (res.ok) return res.text();
      return null;
    },
    [projectId]
  );

  const writeFile = useCallback(
    async (path: string, content: string): Promise<boolean> => {
      if (!projectId) return false;
      const res = await fetch(
        `/api/v1/builder/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "text/plain" },
          body: content,
        }
      );
      return res.ok;
    },
    [projectId]
  );

  const createFile = useCallback(
    async (path: string, type: "file" | "directory"): Promise<boolean> => {
      if (!projectId) return false;
      const res = await fetch(
        `/api/v1/builder/projects/${projectId}/files`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, type }),
        }
      );
      if (res.ok) await fetchTree();
      return res.ok;
    },
    [projectId, fetchTree]
  );

  const deletePath = useCallback(
    async (path: string): Promise<boolean> => {
      if (!projectId) return false;
      const res = await fetch(
        `/api/v1/builder/projects/${projectId}/files?path=${encodeURIComponent(path)}`,
        { method: "DELETE" }
      );
      if (res.ok) await fetchTree();
      return res.ok;
    },
    [projectId, fetchTree]
  );

  return { fetchTree, readFile, writeFile, createFile, deletePath };
}
