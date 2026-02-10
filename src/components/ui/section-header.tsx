import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-foreground-muted">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
