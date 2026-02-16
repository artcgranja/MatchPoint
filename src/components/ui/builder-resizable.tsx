"use client";

import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

function BuilderPanelGroup({
  className,
  direction,
  ...props
}: Omit<React.ComponentProps<typeof Group>, "orientation"> & {
  direction?: "horizontal" | "vertical";
}) {
  return (
    <Group
      orientation={direction}
      className={cn("flex h-full w-full", className)}
      {...props}
    />
  );
}

const BuilderPanel = Panel;

function BuilderHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) {
  return (
    <Separator
      className={cn(
        "group/handle relative flex items-center justify-center bg-border after:absolute after:content-[''] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[separator=hover]:bg-highlight/50 data-[separator=active]:bg-highlight",
        "aria-[orientation=vertical]:w-px aria-[orientation=vertical]:after:inset-y-0 aria-[orientation=vertical]:after:-left-1 aria-[orientation=vertical]:after:-right-1",
        "aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:right-0 aria-[orientation=horizontal]:after:-top-1 aria-[orientation=horizontal]:after:-bottom-1",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-8 w-3 items-center justify-center rounded-sm border border-border bg-background-secondary group-aria-[orientation=horizontal]/handle:h-3 group-aria-[orientation=horizontal]/handle:w-8">
          <GripVertical className="h-3 w-3 text-foreground-muted group-aria-[orientation=horizontal]/handle:rotate-90" />
        </div>
      )}
    </Separator>
  );
}

export { BuilderPanelGroup, BuilderPanel, BuilderHandle };
