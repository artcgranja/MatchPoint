import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-6">
      <Compass className="h-16 w-16 text-highlight mb-6" />
      <h1 className="text-6xl font-bold font-code">404</h1>
      <p className="mt-4 text-xl text-foreground-muted">
        This page couldn&apos;t be found
      </p>
      <p className="mt-2 text-sm text-foreground-muted max-w-md">
        The page you&apos;re looking for might have been moved or doesn&apos;t
        exist. Let&apos;s get you back on track.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
