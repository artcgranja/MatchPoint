"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon, Maximize2, Minimize2 } from "lucide-react";
import { useBuilderStore } from "@/stores/builder-store";
import { cn } from "@/lib/utils";
import "@xterm/xterm/css/xterm.css";

export function TerminalPanel() {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitAddonRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const projectId = useBuilderStore((s) => s.projectId);
  const sandboxReady = useBuilderStore((s) => s.sandboxReady);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!termRef.current || !sandboxReady || !projectId) return;

    let mounted = true;

    async function initTerminal() {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      if (!mounted || !termRef.current) return;

      const term = new Terminal({
        theme: {
          background: "#0a0a0f",
          foreground: "#e4e4e7",
          cursor: "#3b82f6",
          cursorAccent: "#0a0a0f",
          selectionBackground: "#3b82f630",
        },
        fontFamily: "'Fira Code', monospace",
        fontSize: 13,
        cursorBlink: true,
        scrollback: 5000,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      term.open(termRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      term.writeln("\x1b[1;34m~ Builder Terminal ~\x1b[0m");
      term.writeln("");

      // Connect to terminal SSE for output
      const eventSource = new EventSource(
        `/api/v1/builder/projects/${projectId}/terminal`
      );

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.output) term.write(data.output);
        } catch {
          // Ignore parse errors
        }
      };

      // Send keystrokes
      term.onData((data) => {
        fetch(`/api/v1/builder/projects/${projectId}/terminal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: data }),
        }).catch(() => {});
      });

      return () => {
        eventSource.close();
        term.dispose();
      };
    }

    const cleanup = initTerminal();
    return () => {
      mounted = false;
      cleanup.then((fn) => fn?.());
    };
  }, [projectId, sandboxReady]);

  // Resize on panel change
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });
    if (termRef.current) observer.observe(termRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("flex h-full flex-col bg-[#0a0a0f]", maximized && "fixed inset-0 z-50")}>
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-1">
        <div className="flex items-center gap-1.5">
          <TerminalIcon className="h-3 w-3 text-foreground-muted" />
          <span className="text-xs font-medium text-foreground-muted">
            Terminal
          </span>
        </div>
        <button
          onClick={() => setMaximized(!maximized)}
          className="rounded-sm p-0.5 text-foreground-muted transition-colors hover:text-foreground"
        >
          {maximized ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </button>
      </div>
      <div ref={termRef} className="flex-1 p-1" />
    </div>
  );
}
