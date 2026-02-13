"use client";

import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  const t = useTranslations("Settings");

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("title")}
        description={t("description")}
      />
      <SettingsForm />
    </div>
  );
}
