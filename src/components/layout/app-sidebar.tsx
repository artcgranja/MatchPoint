"use client";

import { usePathname } from "@/i18n/navigation";
import {
  Home,
  PanelLeftClose,
  PanelLeft,
  Compass,
  Bookmark,
  LayoutGrid,
  Settings,
  LogOut,
  LogIn,
  Moon,
  Sun,
  Monitor,
  Inbox,
  Building2,
  Send,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAuthStore } from "@/stores/auth-store";
import { useLoginModalStore } from "@/stores/login-modal-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useSessionNavigation } from "@/hooks/use-session-navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const tCommon = useTranslations("Common");
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const { theme, setTheme } = useTheme();
  const currentSessionId = useDiscoveryStore((s) => s.sessionId);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { goHome } = useSessionNavigation();

  const isBuilder = user?.role === "builder";

  const isOnChat = pathname === "/" || pathname === "/search";
  const isHomeActive = isOnChat && !currentSessionId;
  const isDescubraActive = pathname.startsWith("/descubra");
  const isSalvosActive = pathname.startsWith("/salvos");
  const isSearchesActive = pathname.startsWith("/searches");
  const isConexoesActive = pathname.startsWith("/conexoes");
  const isCompanyActive = pathname.startsWith("/company");

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    goHome();
  };

  const initials = getInitials(user?.name);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col overflow-hidden border-r border-border bg-background-secondary/50 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header: logo + collapse toggle */}
      <div className={cn(
        "flex items-center px-4 pt-4 pb-2",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {collapsed ? (
          <button
            onClick={toggleCollapsed}
            aria-label={t("expandSidebar")}
            className="rounded-lg p-1 text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
        ) : (
          <>
            <Compass className="h-6 w-6 shrink-0 text-highlight" />
            <button
              onClick={toggleCollapsed}
              aria-label={t("collapseSidebar")}
              className="rounded-lg p-1 text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-2 flex flex-col gap-1 px-2">
        {isBuilder ? (
          /* Builder nav */
          <>
            <Link
              href="/"
              onClick={handleHomeClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isHomeActive
                  ? "bg-highlight/10 text-highlight"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              )}
            >
              <Inbox className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t("connections")}</span>}
            </Link>
            <Link
              href="/company"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isCompanyActive
                  ? "bg-highlight/10 text-highlight"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              )}
            >
              <Building2 className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t("companyProfile")}</span>}
            </Link>
          </>
        ) : (
          /* Seeker nav */
          <>
            <Link
              href="/"
              onClick={handleHomeClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isHomeActive
                  ? "bg-highlight/10 text-highlight"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              )}
            >
              <Home className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t("home")}</span>}
            </Link>
            <Link
              href="/descubra"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isDescubraActive
                  ? "bg-highlight/10 text-highlight"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              )}
            >
              <Compass className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t("discover")}</span>}
            </Link>

            {/* Processes section */}
            {!collapsed && (
              <span className="mt-4 mb-1 px-3 text-xs font-medium uppercase tracking-wider text-foreground-muted/50">
                {t("processes")}
              </span>
            )}
            {collapsed && <div className="my-2 mx-3 border-t border-border" />}
            <Link
              href="/salvos"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isSalvosActive
                  ? "bg-highlight/10 text-highlight"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              )}
            >
              <Bookmark className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t("saved")}</span>}
            </Link>
            <Link
              href="/searches"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isSearchesActive
                  ? "bg-highlight/10 text-highlight"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t("searches")}</span>}
            </Link>
            <Link
              href="/conexoes"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isConexoesActive
                  ? "bg-highlight/10 text-highlight"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              )}
            >
              <Send className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t("connections")}</span>}
            </Link>
          </>
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

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
                  {t("settings")}
                </Link>
              </DropdownMenuItem>
              <div className="mx-1 my-1 flex items-center gap-1 rounded-lg bg-background-secondary/50 p-1">
                {([
                  { value: "system", icon: Monitor },
                  { value: "light", icon: Sun },
                  { value: "dark", icon: Moon },
                ] as const).map((opt) => (
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
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut className="h-4 w-4" />
                {tCommon("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={() => useLoginModalStore.getState().openLoginModal()}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-background-secondary text-foreground-muted",
              collapsed && "justify-center"
            )}
          >
            <LogIn className="h-4 w-4 shrink-0 text-highlight" />
            {!collapsed && <span>{tCommon("login")}</span>}
          </button>
        )}

      </div>
    </aside>
  );
}
