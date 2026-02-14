"use client";

import { CompanyModal } from "@/components/shared/company-modal";
import type { BrowseCompanyDetail } from "@/types";

interface CompanyDetailDialogProps {
  company: BrowseCompanyDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDetailDialog({
  company,
  open,
  onOpenChange,
}: CompanyDetailDialogProps) {
  return (
    <CompanyModal
      company={{
        ...company,
        location: company.allLocations,
      }}
      open={open}
      onOpenChange={onOpenChange}
      mode="browse"
    />
  );
}
