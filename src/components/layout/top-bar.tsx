"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";

const routeLabels: Record<string, string> = {
  "/": "Discovery",
  "/settings": "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const baseRoute = "/" + (pathname.split("/")[1] || "");
  const label = routeLabels[baseRoute] || "Dashboard";

  return (
    <header className="glass flex h-14 items-center justify-between gap-4 px-6">
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <span>MatchPoint</span>
        <span>/</span>
        <span className="text-foreground font-medium">{label}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9 bg-background-secondary/50"
          />
        </div>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-highlight text-highlight-foreground text-xs">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
