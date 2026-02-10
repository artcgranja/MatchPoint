import { GlassCard } from "@/components/ui/glass-card";

interface ReportSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ReportSection({ title, children }: ReportSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold border-b border-border pb-2">
        {title}
      </h3>
      <div className="text-sm text-foreground-muted leading-relaxed">
        {children}
      </div>
    </div>
  );
}
