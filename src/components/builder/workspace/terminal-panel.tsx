"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon, Maximize2, Minimize2 } from "lucide-react";
import { useBuilderStore } from "@/stores/builder-store";
import { cn } from "@/lib/utils";
import "@xterm/xterm/css/xterm.css";

const MAX_RECONNECT_ATTEMPTS = 3;
const KEYSTROKE_BATCH_MS = 50;

export function TerminalPanel() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitAddonRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const projectId = useBuilderStore((s) => s.projectId);
  const sandboxReady = useBuilderStore((s) => s.sandboxReady);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!termRef.current || !sandboxReady || !projectId) return;

    let mounted = true;
    let eventSource: EventSource | null = null;
    let term: import("@xterm/xterm").Terminal | null = null;
    let inputBuffer: string[] = [];
    let flushTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    let stableTimer: NodeJS.Timeout | null = null;

    async function initTerminal() {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      if (!mounted || !termRef.current) return;

      term = new Terminal({
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
      function connectEventSource() {
        if (!mounted) return;
        eventSource = new EventSource(
          `/api/v1/builder/projects/${projectId}/terminal`
        );

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.output) term?.write(data.output);
            // Store PTY pid if provided
            if (data.pid != null) {
              (term as unknown as { _ptyPid?: number })._ptyPid = data.pid;
            }
          } catch {
            // Ignore parse errors
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          eventSource = null;
          if (stableTimer) { clearTimeout(stableTimer); stableTimer = null; }

          if (!mounted) return;
          reconnectAttempts++;

          if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
            term?.writeln(
              `\r\n\x1b[33mConnection lost. Reconnecting (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...\x1b[0m`
            );
            setTimeout(connectEventSource, 2000 * reconnectAttempts);
          } else {
            term?.writeln(
              "\r\n\x1b[31mTerminal disconnected. Refresh the page to reconnect.\x1b[0m"
            );
          }
        };

        eventSource.onopen = () => {
          // Only reset after the connection stays open for 5 seconds
          if (stableTimer) clearTimeout(stableTimer);
          stableTimer = setTimeout(() => {
            reconnectAttempts = 0;
            stableTimer = null;
          }, 5000);
        };
      }

      connectEventSource();

      // Batch keystrokes to reduce POST requests
      const flushInput = () => {
        if (inputBuffer.length === 0) return;
        const batch = inputBuffer.join("");
        inputBuffer = [];
        flushTimeout = null;

        fetch(`/api/v1/builder/projects/${projectId}/terminal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: batch }),
        }).catch(() => {});
      };

      term.onData((data) => {
        inputBuffer.push(data);
        if (!flushTimeout) {
          flushTimeout = setTimeout(flushInput, KEYSTROKE_BATCH_MS);
        }
      });
    }

    initTerminal().catch((err) => {
      console.error("Failed to initialize terminal:", err);
    });

    return () => {
      mounted = false;
      eventSource?.close();
      eventSource = null;
      if (flushTimeout) clearTimeout(flushTimeout);
      if (stableTimer) clearTimeout(stableTimer);
      term?.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [projectId, sandboxReady]);

  // Debounced resize: observe the WRAPPER (not the xterm element) to avoid feedback loop
  useEffect(() => {
    if (!wrapperRef.current) return;

    let rafId: number | null = null;
    let lastCols = 0;
    let lastRows = 0;

    const observer = new ResizeObserver(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const fitAddon = fitAddonRef.current;
        if (!fitAddon) return;

        // Only fit if dimensions actually changed — breaks the feedback loop
        const dims = fitAddon.proposeDimensions();
        if (!dims) return;
        if (dims.cols === lastCols && dims.rows === lastRows) return;

        lastCols = dims.cols;
        lastRows = dims.rows;
        fitAddon.fit();
      });
    });

    observer.observe(wrapperRef.current);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={cn("flex h-full flex-col bg-[#0a0a0f]", maximized && "fixed inset-0 z-50")}>
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-1">
        <div className="flex items-center gap-1.5">
          <TerminalIcon className="h-3 w-3 text-foreground-muted" />
          <span className="text-xs font-medium text-foreground-muted">
            Terminal
          </span>
        </div>
        <button
          onClick={() => setMaximized(!maximized)}
          className="rounded-sm p-0.5 text-foreground-muted transition-colors hover:text-foreground"
          aria-label={maximized ? "Minimize terminal" : "Maximize terminal"}
        >
          {maximized ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </button>
      </div>
      {/* Wrapper: relative + overflow-hidden + min-h-0 prevents xterm from pushing parent */}
      <div ref={wrapperRef} className="relative min-h-0 flex-1 overflow-hidden">
        {/* Terminal: absolute positioning decouples from parent content sizing */}
        <div ref={termRef} className="absolute inset-0 p-1" />
      </div>
    </div>
  );
}
