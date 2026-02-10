import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const glassCardVariants = cva(
  "glass rounded-xl p-6 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "",
        highlight: "border-highlight/20 shadow-highlight/5 shadow-lg",
        sage: "border-sage/20 shadow-sage/5 shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export function GlassCard({
  className,
  variant,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div className={cn(glassCardVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}
