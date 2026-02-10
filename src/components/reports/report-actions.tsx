"use client";

import { Download, Share2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export function ReportActions() {
  const handleAction = (action: string) => {
    alert(`${action} - This is a demo feature`);
  };

  return (
    <GlassCard className="flex flex-wrap items-center gap-3">
      <Button
        variant="default"
        size="sm"
        className="gap-2"
        onClick={() => handleAction("Download PDF")}
      >
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => handleAction("Share Link")}
      >
        <Share2 className="h-4 w-4" />
        Share Link
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => handleAction("Email Report")}
      >
        <Mail className="h-4 w-4" />
        Email
      </Button>
    </GlassCard>
  );
}
