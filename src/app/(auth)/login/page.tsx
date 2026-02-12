"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirects /login to home with login modal open.
 * Keeps backwards compatibility for old links and bookmarks.
 */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?login=1");
  }, [router]);

  return null;
}
