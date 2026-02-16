"use client";

import { useState } from "react";
import { Loader2, Github, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface GithubSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingRepo: string | null;
  onSuccess: (repoUrl: string) => void;
}

export function GithubSyncDialog({
  open,
  onOpenChange,
  projectId,
  existingRepo,
  onSuccess,
}: GithubSyncDialogProps) {
  const [repoName, setRepoName] = useState("");
  const [commitMessage, setCommitMessage] = useState("Sync from MatchPoint Builder");
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isCreate = !existingRepo;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isCreate) {
        const res = await fetch(`/api/v1/builder/projects/${projectId}/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoName, isPrivate }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onSuccess(data.repoUrl);
      } else {
        const res = await fetch(
          `/api/v1/builder/projects/${projectId}/github/sync`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commitMessage }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onSuccess(data.commitUrl ?? existingRepo);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Github className="h-5 w-5" />
          <h2 className="text-lg font-semibold">
            {isCreate ? "Create GitHub Repository" : "Push to GitHub"}
          </h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {isCreate ? (
          <>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="Repository name"
              className="mb-3 w-full rounded-lg border border-border bg-background-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-highlight focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsPrivate(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all",
                  isPrivate
                    ? "border-highlight bg-highlight/5 text-highlight"
                    : "border-border text-foreground-muted"
                )}
              >
                <Lock className="h-3 w-3" /> Private
              </button>
              <button
                onClick={() => setIsPrivate(false)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all",
                  !isPrivate
                    ? "border-highlight bg-highlight/5 text-highlight"
                    : "border-border text-foreground-muted"
                )}
              >
                <Globe className="h-3 w-3" /> Public
              </button>
            </div>
          </>
        ) : (
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message"
            className="mb-4 w-full rounded-lg border border-border bg-background-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-highlight focus:outline-none"
            autoFocus
          />
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (isCreate && !repoName.trim())}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
              loading || (isCreate && !repoName.trim())
                ? "bg-highlight/40 cursor-not-allowed"
                : "bg-highlight hover:bg-highlight/90"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isCreate ? "Create & Push" : "Push"}
          </button>
        </div>
      </div>
    </div>
  );
}
