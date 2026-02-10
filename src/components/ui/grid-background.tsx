import { cn } from "@/lib/utils";

interface GridBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function GridBackground({ className, children }: GridBackgroundProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 grid-bg" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, var(--background) 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
