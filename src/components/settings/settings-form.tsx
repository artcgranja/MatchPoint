"use client";

import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
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
  const t = useTranslations("Settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const {
    notificationsEnabled,
    compactView,
    setNotificationsEnabled,
    setCompactView,
  } = useSettingsStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <SettingsSection
        title={t("appearance")}
        description={t("appearanceDescription")}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">{t("theme")}</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-40" id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("themeLight")}</SelectItem>
                <SelectItem value="dark">{t("themeDark")}</SelectItem>
                <SelectItem value="system">{t("themeSystem")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="language">{t("language")}</Label>
            <Select
              value={locale}
              onValueChange={(newLocale) => {
                router.replace(pathname, { locale: newLocale as "en" | "pt-BR" });
              }}
            >
              <SelectTrigger className="w-40" id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("languageEN")}</SelectItem>
                <SelectItem value="pt-BR">{t("languagePTBR")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact">{t("compactView")}</Label>
              <p className="text-xs text-foreground-muted">
                {t("compactViewDescription")}
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
        title={t("notifications")}
        description={t("notificationsDescription")}
      >
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notifications">{t("enableNotifications")}</Label>
            <p className="text-xs text-foreground-muted">
              {t("enableNotificationsDescription")}
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
        title={t("searchDefaults")}
        description={t("searchDefaultsDescription")}
      >
        <p className="text-sm text-foreground-muted">
          {t("searchDefaultsHint")}
        </p>
      </SettingsSection>
    </div>
  );
}
