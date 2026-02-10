import { cn } from "@/lib/utils";

type Status = "idle" | "running" | "complete" | "error";

const statusConfig: Record<Status, { color: string; label: string }> = {
  idle: { color: "bg-foreground-muted", label: "Idle" },
  running: { color: "bg-highlight", label: "Running" },
  complete: { color: "bg-sage", label: "Complete" },
  error: { color: "bg-destructive", label: "Error" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {status === "running" && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.color
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            config.color
          )}
        />
      </span>
      <span>{config.label}</span>
    </div>
  );
}
