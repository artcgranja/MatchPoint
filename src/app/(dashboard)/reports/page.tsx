"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportPreview } from "@/components/reports/report-preview";
import { ReportActions } from "@/components/reports/report-actions";
import { getStartups } from "@/lib/mock-data";
import type { Startup } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReportsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStartups().then((data) => {
      setStartups(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Reports" />
        <div className="h-96 animate-pulse rounded-xl bg-background-secondary" />
      </div>
    );
  }

  if (startups.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Reports" />
        <EmptyState
          icon={FileText}
          title="No reports available"
          description="Run a search first to generate analysis reports."
          action={
            <Button asChild>
              <Link href="/search">Go to Search</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports"
        description="AI-generated analysis reports for your searches."
      />
      <ReportActions />
      <ReportPreview startups={startups} />
    </div>
  );
}
