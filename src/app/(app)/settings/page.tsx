"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Configurações"
        description="Gerencie suas preferências e configurações de conta."
      />
      <SettingsForm />
    </div>
  );
}
