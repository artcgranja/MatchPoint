"use client";

import { useState, useCallback } from "react";

interface SessionTarget {
  id: string;
  title: string;
}

interface UseSessionActionsOptions {
  onDelete: (sessionId: string) => Promise<void> | void;
  onRename: (sessionId: string, newTitle: string) => Promise<string | null | void> | void;
}

export function useSessionActions({ onDelete, onRename }: UseSessionActionsOptions) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionTarget | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<SessionTarget | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const requestDelete = useCallback((session: SessionTarget) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!sessionToDelete) return;
    await onDelete(sessionToDelete.id);
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  }, [sessionToDelete, onDelete]);

  const requestRename = useCallback((session: SessionTarget) => {
    setSessionToRename(session);
    setRenameValue(session.title);
    setRenameDialogOpen(true);
  }, []);

  const confirmRename = useCallback(async () => {
    if (!sessionToRename) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === sessionToRename.title) {
      setRenameDialogOpen(false);
      return;
    }
    setIsRenaming(true);
    try {
      await onRename(sessionToRename.id, trimmed);
    } finally {
      setIsRenaming(false);
      setRenameDialogOpen(false);
      setSessionToRename(null);
    }
  }, [sessionToRename, renameValue, onRename]);

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    sessionToDelete,
    requestDelete,
    confirmDelete,
    renameDialogOpen,
    setRenameDialogOpen,
    sessionToRename,
    renameValue,
    setRenameValue,
    isRenaming,
    requestRename,
    confirmRename,
  };
}

export type SessionActions = ReturnType<typeof useSessionActions>;
