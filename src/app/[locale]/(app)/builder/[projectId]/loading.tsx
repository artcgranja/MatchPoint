import { Loader2 } from "lucide-react";

export default function BuilderProjectLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-highlight" />
        <p className="text-sm text-foreground-muted">Loading workspace...</p>
      </div>
    </div>
  );
}
