"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  PanelLeftClose,
  PanelLeft,
  Compass,
  Plus,
  Settings,
  LogOut,
  LogIn,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { useSearchStore } from "@/stores/search-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { SessionList } from "@/components/layout/session-list";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const { theme, setTheme } = useTheme();
  const resetDiscovery = useDiscoveryStore((s) => s.reset);
  const resetPanel = useAgentPanelStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isSearchActive = pathname === "/" || pathname === "/search";

  const handleNewChat = () => {
    resetDiscovery();
    resetPanel();
    useSearchStore.getState().resetPipeline();
    if (pathname !== "/") router.push("/");
  };

  const initials = getInitials(user?.name);

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
          {!collapsed && <span>Novo Chat</span>}
        </Button>
      </div>

      {/* Nav */}
      <nav className="mt-1 flex flex-col gap-1 px-2">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            isSearchActive
              ? "bg-highlight/10 text-highlight"
              : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Descoberta</span>}
        </Link>
      </nav>

      {/* Session history */}
      {!collapsed && <SessionList />}

      {/* Spacer (only when collapsed or no session list) */}
      {collapsed && <div className="flex-1" />}

      {/* Footer: avatar + collapse */}
      <div className="flex flex-col gap-2 border-t border-border p-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-background-secondary",
                  collapsed && "justify-center"
                )}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  {user.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.name ?? ""} />
                  )}
                  <AvatarFallback className="bg-highlight/15 text-highlight text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <span className="truncate text-foreground-muted">
                    {user.name ?? user.email}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  Configurações
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
                {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-background-secondary text-foreground-muted",
              collapsed && "justify-center"
            )}
          >
            <LogIn className="h-4 w-4 shrink-0 text-highlight" />
            {!collapsed && <span>Entrar</span>}
          </Link>
        )}

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
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
