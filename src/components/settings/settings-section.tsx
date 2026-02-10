import { GlassCard } from "@/components/ui/glass-card";

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <GlassCard>
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-foreground-muted">{description}</p>
      </div>
      {children}
    </GlassCard>
  );
}
