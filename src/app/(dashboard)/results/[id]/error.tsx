"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-xl bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">
        Failed to load startup profile
      </h2>
      <p className="mt-1 text-sm text-foreground-muted max-w-md">
        We couldn&apos;t load this startup&apos;s data. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button asChild variant="outline">
          <Link href="/results">Back to Results</Link>
        </Button>
      </div>
    </div>
  );
}
