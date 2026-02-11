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
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:-left-1 after:-right-1 after:content-[''] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:right-0 data-[panel-group-direction=vertical]:after:-top-1 data-[panel-group-direction=vertical]:after:-bottom-1 [&[data-resize-handle-state=hover]]:bg-highlight/50 [&[data-resize-handle-state=drag]]:bg-highlight",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-8 w-3 items-center justify-center rounded-sm border border-border bg-background-secondary">
          <GripVertical className="h-3 w-3 text-foreground-muted" />
        </div>
      )}
    </Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
