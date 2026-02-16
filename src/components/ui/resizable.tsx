"use client";

import { GripVertical } from "lucide-react";
import {
  Group,
  Panel,
  Separator,
} from "react-resizable-panels";
import { cn } from "@/lib/utils";

function ResizablePanelGroup({
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

const ResizablePanel = Panel;

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) {
  return (
    <Separator
      className={cn(
        "group/handle relative flex w-px items-center justify-center bg-border",
        "after:absolute after:inset-y-0 after:-left-1 after:-right-1 after:content-['']",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
        // Vertical orientation (horizontal separator between stacked panels)
        "aria-[orientation=vertical]:h-px aria-[orientation=vertical]:w-full",
        "aria-[orientation=vertical]:after:inset-y-auto aria-[orientation=vertical]:after:inset-x-0",
        "aria-[orientation=vertical]:after:-top-1 aria-[orientation=vertical]:after:-bottom-1",
        // Interaction states (v4 uses data-separator attribute)
        "data-[separator=hover]:bg-highlight/50",
        "data-[separator=active]:bg-highlight",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-8 w-3 items-center justify-center rounded-sm border border-border bg-background-secondary group-aria-[orientation=vertical]/handle:h-3 group-aria-[orientation=vertical]/handle:w-8">
          <GripVertical className="h-3 w-3 text-foreground-muted group-aria-[orientation=vertical]/handle:rotate-90" />
        </div>
      )}
    </Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
