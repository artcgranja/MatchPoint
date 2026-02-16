"use client";

import { useRef, useCallback, useEffect } from "react";
import {
  BuilderHandle,
  BuilderPanel,
  BuilderPanelGroup,
} from "@/components/ui/builder-resizable";
import { useDefaultLayout } from "react-resizable-panels";
import { WorkspaceTopbar } from "./workspace-topbar";
import { FileTreePanel } from "./file-tree-panel";
import { EditorPanel } from "./editor-panel";
import { TerminalPanel } from "./terminal-panel";
import { ChatPanel } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";
import { useBuilderStore } from "@/stores/builder-store";
import type { BuilderProject } from "@/types/builder";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";

interface WorkspaceLayoutProps {
  project: BuilderProject;
}

const CHAT_COLLAPSED_SIZE = 3;

export function WorkspaceLayout({ project }: WorkspaceLayoutProps) {
  const setChatOpen = useBuilderStore((s) => s.setChatOpen);
  const previewUrl = useBuilderStore((s) => s.previewUrl);
  const chatPanelRef = useRef<PanelImperativeHandle>(null);

  // Persist horizontal layout across page loads
  const horizontalLayout = useDefaultLayout({
    id: "builder-workspace",
    panelIds: ["chat", "editor", "filetree"],
  });

  // Persist vertical editor/terminal layout
  const verticalLayout = useDefaultLayout({
    id: "builder-editor-vertical",
    panelIds: ["editor-main", "terminal"],
  });

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
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, []);

  // Sync chat panel collapse state with store
  const handleChatResize = useCallback(
    (size: PanelSize) => {
      setChatOpen(size.asPercentage > CHAT_COLLAPSED_SIZE);
    },
    [setChatOpen]
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <WorkspaceTopbar project={project} onToggleChat={toggleChat} />

      <BuilderPanelGroup
        direction="horizontal"
        className="flex-1"
        defaultLayout={horizontalLayout.defaultLayout}
        onLayoutChanged={horizontalLayout.onLayoutChanged}
      >
        {/* Chat Panel — primary panel (left, Bolt.new pattern) */}
        <BuilderPanel
          id="chat"
          panelRef={chatPanelRef}
          defaultSize={28}
          minSize={20}
          maxSize={45}
          collapsible
          collapsedSize={CHAT_COLLAPSED_SIZE}
          onResize={handleChatResize}
        >
          <ChatPanel projectId={project.id} />
        </BuilderPanel>

        <BuilderHandle withHandle />

        {/* Center: Editor/Preview + Terminal */}
        <BuilderPanel
          id="editor"
          defaultSize={55}
          minSize={30}
          maxSize={70}
        >
          <BuilderPanelGroup
            direction="vertical"
            defaultLayout={verticalLayout.defaultLayout}
            onLayoutChanged={verticalLayout.onLayoutChanged}
          >
            {/* Editor or Preview */}
            <BuilderPanel
              id="editor-main"
              defaultSize={75}
              minSize={30}
            >
              {previewUrl ? <PreviewPanel /> : <EditorPanel />}
            </BuilderPanel>

            <BuilderHandle withHandle />

            {/* Terminal */}
            <BuilderPanel
              id="terminal"
              defaultSize={25}
              minSize={10}
              maxSize={50}
              collapsible
              collapsedSize={3}
            >
              <TerminalPanel />
            </BuilderPanel>
          </BuilderPanelGroup>
        </BuilderPanel>

        <BuilderHandle withHandle />

        {/* File Tree — secondary panel (right) */}
        <BuilderPanel
          id="filetree"
          defaultSize={17}
          minSize={12}
          maxSize={25}
          collapsible
          collapsedSize={3}
          className="bg-background-secondary/30"
        >
          <FileTreePanel />
        </BuilderPanel>
      </BuilderPanelGroup>
    </div>
  );
}
