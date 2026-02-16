"use client";

import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  const t = useTranslations("Settings");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      <SectionHeader
        title={t("title")}
        description={t("description")}
      />
      <SettingsForm />
    </div>
  );
}
