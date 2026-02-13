"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  Compass,
  ChevronDown,
  Home,
  Pencil,
  PanelRightOpen,
  PanelRightClose,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
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
import { StageIndicator } from "@/components/discovery/phase-indicator";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { useSearchStore } from "@/stores/search-store";
import type { SessionStage } from "@/types";

interface ChatNavbarProps {
  sessionId: string;
  sessionTitle: string | null;
  currentStage: SessionStage;
  showPanel: boolean;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onRename: (sessionId: string, newTitle: string) => Promise<string | null>;
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

export function ChatNavbar({
  sessionId,
  sessionTitle,
  currentStage,
  showPanel,
  panelOpen,
  onTogglePanel,
  onRename,
}: ChatNavbarProps) {
  const router = useRouter();
  const t = useTranslations("Chat");
  const tCommon = useTranslations("Common");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const displayTitle = sessionTitle ?? t("newChat");

  const handleHomeClick = () => {
    useDiscoveryStore.getState().reset();
    useAgentPanelStore.getState().reset();
    useSearchStore.getState().resetPipeline();
    router.push("/");
  };

  const handleOpenRename = () => {
    setRenameValue(displayTitle);
    setIsRenameOpen(true);
  };

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === sessionTitle) {
      setIsRenameOpen(false);
      return;
    }
    setIsRenaming(true);
    await onRename(sessionId, trimmed);
    setIsRenaming(false);
    setIsRenameOpen(false);
  };

  useEffect(() => {
    if (isRenameOpen) {
      setTimeout(() => renameInputRef.current?.select(), 50);
    }
  }, [isRenameOpen]);

  return (
    <>
      <div className="relative flex items-center border-b border-border px-4 py-2">
        {/* Left: Logo + Title dropdown */}
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 shrink-0 text-highlight" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex max-w-[200px] items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-background-secondary">
                <span className="truncate">{displayTitle}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={handleHomeClick}>
                <Home className="h-4 w-4" />
                {t("backToHome")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenRename}>
                <Pencil className="h-4 w-4" />
                {t("renameProject")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ThemeControl />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center: Stage indicator */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <StageIndicator currentStage={currentStage} />
        </div>

        {/* Right: Panel toggle */}
        <div className="ml-auto">
          {showPanel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-foreground-muted transition-colors hover:text-foreground"
              onClick={onTogglePanel}
              aria-label={panelOpen ? t("closePanel") : t("openPanel")}
            >
              {panelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Rename dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("renameProject")}</DialogTitle>
          </DialogHeader>
          <Input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
            maxLength={120}
            placeholder={t("projectName")}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsRenameOpen(false)}
              disabled={isRenaming}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleRename} disabled={isRenaming}>
              {isRenaming ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
