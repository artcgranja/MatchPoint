"use client";

import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "./settings-section";
import { useSettingsStore } from "@/stores/settings-store";

export function SettingsForm() {
  const { setTheme, theme } = useTheme();
  const {
    notificationsEnabled,
    compactView,
    setNotificationsEnabled,
    setCompactView,
  } = useSettingsStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <SettingsSection
        title="Appearance"
        description="Customize how MatchPoint looks."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-40" id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact">Compact View</Label>
              <p className="text-xs text-foreground-muted">
                Show more items with less spacing
              </p>
            </div>
            <Switch
              id="compact"
              checked={compactView}
              onCheckedChange={setCompactView}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        description="Configure how you receive updates."
      >
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notifications">Enable Notifications</Label>
            <p className="text-xs text-foreground-muted">
              Get notified when searches complete
            </p>
          </div>
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Search Defaults"
        description="Set default filters for new searches."
      >
        <p className="text-sm text-foreground-muted">
          Default filter configuration will be applied automatically when you
          start a new search. You can customize these on the Search page.
        </p>
      </SettingsSection>
    </div>
  );
}
