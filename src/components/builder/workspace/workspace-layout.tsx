"use client";

import { useRef, useCallback, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WorkspaceTopbar } from "./workspace-topbar";
import { FileTreePanel } from "./file-tree-panel";
import { EditorPanel } from "./editor-panel";
import { TerminalPanel } from "./terminal-panel";
import { ChatPanel } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";
import { useBuilderStore } from "@/stores/builder-store";
import type { BuilderProject } from "@/types/builder";
import type { PanelImperativeHandle } from "react-resizable-panels";

interface WorkspaceLayoutProps {
  project: BuilderProject;
}

export function WorkspaceLayout({ project }: WorkspaceLayoutProps) {
  const chatOpen = useBuilderStore((s) => s.chatOpen);
  const setChatOpen = useBuilderStore((s) => s.setChatOpen);
  const previewUrl = useBuilderStore((s) => s.previewUrl);
  const chatPanelRef = useRef<PanelImperativeHandle>(null);

  // Hydrate store with project data on mount
  useEffect(() => {
    const store = useBuilderStore.getState();
    store.setProjectId(project.id);
    store.setProjectName(project.name);
    if (project.sandboxId) {
      store.setSandboxId(project.sandboxId);
      store.setSandboxReady(true);
    }
    return () => { useBuilderStore.getState().reset(); };
  }, [project.id, project.name, project.sandboxId]);

  const toggleChat = useCallback(() => {
    const panel = chatPanelRef.current;
    if (!panel) return;
    if (chatOpen) {
      panel.collapse();
      setChatOpen(false);
    } else {
      panel.expand();
      setChatOpen(true);
    }
  }, [chatOpen, setChatOpen]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <WorkspaceTopbar project={project} onToggleChat={toggleChat} />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* File Tree */}
        <ResizablePanel
          defaultSize={15}
          minSize={10}
          maxSize={25}
          collapsible
          className="bg-background-secondary/30"
        >
          <FileTreePanel />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center: Editor/Preview + Terminal */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            {/* Editor or Preview */}
            <ResizablePanel defaultSize={75} minSize={30}>
              {previewUrl ? <PreviewPanel /> : <EditorPanel />}
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Terminal */}
            <ResizablePanel
              defaultSize={25}
              minSize={10}
              maxSize={50}
              collapsible
            >
              <TerminalPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        {/* Chat Panel — always rendered, collapsible */}
        <ResizableHandle withHandle />
        <ResizablePanel
          panelRef={chatPanelRef}
          defaultSize={25}
          minSize={15}
          maxSize={40}
          collapsible
          collapsedSize={0}
        >
          <ChatPanel projectId={project.id} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
