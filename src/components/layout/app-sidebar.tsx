"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  BarChart3,
  GitCompareArrows,
  FileText,
  History,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useState } from "react";

const navItems = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "glass flex h-screen flex-col justify-between transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div>
        <div className="flex items-center gap-2 p-4">
          <Compass className="h-6 w-6 shrink-0 text-highlight" />
          {!collapsed && (
            <span className="text-lg font-bold font-heading">MatchPoint</span>
          )}
        </div>

        <nav className="mt-2 flex flex-col gap-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-highlight/10 text-highlight"
                    : "text-foreground-muted hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2 p-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
