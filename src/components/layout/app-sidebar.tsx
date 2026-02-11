"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  PanelLeftClose,
  PanelLeft,
  Compass,
  Plus,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { useState } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const resetDiscovery = useDiscoveryStore((s) => s.reset);
  const resetPanel = useAgentPanelStore((s) => s.reset);

  const isSearchActive =
    pathname === "/search" || pathname.startsWith("/search/");

  const handleNewChat = () => {
    resetDiscovery();
    resetPanel();
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-background-secondary/50 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Compass className="h-6 w-6 shrink-0 text-highlight" />
        {!collapsed && (
          <span className="text-lg font-bold font-heading">MatchPoint</span>
        )}
      </div>

      {/* New Chat button */}
      <div className="px-2 pt-2 pb-1">
        <Button
          onClick={handleNewChat}
          variant="outline"
          className={cn(
            "w-full gap-2 border-border bg-background-secondary/50 hover:bg-background-secondary",
            collapsed && "px-0"
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Nav */}
      <nav className="mt-1 flex flex-col gap-1 px-2">
        <Link
          href="/search"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            isSearchActive
              ? "bg-highlight/10 text-highlight"
              : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Discovery</span>}
        </Link>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer: avatar + collapse */}
      <div className="flex flex-col gap-2 border-t border-border p-2">
        {/* User avatar with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-background-secondary",
                collapsed && "justify-center"
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-highlight/15 text-highlight text-xs">
                  JD
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <span className="truncate text-foreground-muted">John Doe</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut className="h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
