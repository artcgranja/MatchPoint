"use client";

import type { LucideIcon } from "lucide-react";
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
  Lightbulb,
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAuthStore } from "@/stores/auth-store";
import { useLoginModalStore } from "@/stores/login-modal-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useSessionNavigation } from "@/hooks/use-session-navigation";
import { useNotificationsStore } from "@/stores/notifications-store";

function NavLink({
  href,
  onClick,
  isActive,
  icon: Icon,
  label,
  collapsed,
  badge,
}: {
  href: string;
  onClick?: (e: React.MouseEvent) => void;
  isActive: boolean;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  badge?: string;
}) {
  const link = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-highlight/10 text-highlight font-medium"
          : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
      )}
    >
      <div className="relative shrink-0">
        <Icon className="h-4 w-4" />
        {badge && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[10px] font-bold leading-none text-white">
            {badge}
          </span>
        )}
      </div>
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

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
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  const isOnChat = pathname === "/" || pathname === "/search";
  const isHomeActive = isOnChat && !currentSessionId;
  const isDescubraActive = pathname.startsWith("/descubra");
  const isSalvosActive = pathname.startsWith("/salvos");
  const isSearchesActive = pathname.startsWith("/searches");
  const isConexoesActive = pathname.startsWith("/conexoes");
  const isCompanyActive = pathname.startsWith("/company");
  const isInsightsActive = pathname.startsWith("/product-insights");

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
            <PanelLeft className="h-4 w-4" />
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
            <NavLink
              href="/"
              onClick={handleHomeClick}
              isActive={isHomeActive}
              icon={Send}
              label={t("connections")}
              collapsed={collapsed}
              badge={unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : undefined}
            />
            <NavLink
              href="/company"
              isActive={isCompanyActive}
              icon={Building2}
              label={t("companyProfile")}
              collapsed={collapsed}
            />
            <NavLink
              href="/product-insights"
              isActive={isInsightsActive}
              icon={Lightbulb}
              label={t("productInsights")}
              collapsed={collapsed}
            />
          </>
        ) : (
          /* Seeker nav */
          <>
            <NavLink
              href="/"
              onClick={handleHomeClick}
              isActive={isHomeActive}
              icon={Home}
              label={t("home")}
              collapsed={collapsed}
            />
            <NavLink
              href="/descubra"
              isActive={isDescubraActive}
              icon={Compass}
              label={t("discover")}
              collapsed={collapsed}
            />

            {/* Processes section */}
            {!collapsed && (
              <span className="mt-4 mb-1 px-3 text-xs font-medium uppercase tracking-wider text-foreground-muted/50">
                {t("processes")}
              </span>
            )}
            {collapsed && <div className="my-2 mx-3 border-t border-border" />}
            <NavLink
              href="/salvos"
              isActive={isSalvosActive}
              icon={Bookmark}
              label={t("saved")}
              collapsed={collapsed}
            />
            <NavLink
              href="/searches"
              isActive={isSearchesActive}
              icon={LayoutGrid}
              label={t("searches")}
              collapsed={collapsed}
            />
            <NavLink
              href="/conexoes"
              isActive={isConexoesActive}
              icon={Inbox}
              label={t("connections")}
              collapsed={collapsed}
            />
          </>
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer: avatar only */}
      <div className="flex flex-col gap-2 border-t border-border p-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center rounded-lg px-2 py-2 transition-colors hover:bg-background-secondary",
                  collapsed ? "justify-center" : "justify-start"
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
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => useLoginModalStore.getState().openLoginModal()}
                className={cn(
                  "flex w-full items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-background-secondary text-foreground-muted",
                  collapsed ? "justify-center" : "gap-3"
                )}
              >
                <LogIn className="h-4 w-4 shrink-0 text-highlight" />
                {!collapsed && <span>{tCommon("login")}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">{tCommon("login")}</TooltipContent>
            )}
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
