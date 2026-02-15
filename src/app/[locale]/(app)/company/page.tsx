"use client";

import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { CompanyProfile } from "@/components/company/company-profile";

export default function CompanyProfilePage() {
  const t = useTranslations("CompanyProfile");

  return (
    <div className="space-y-6">
      <SectionHeader title={t("title")} description={t("subtitle")} />
      <CompanyProfile />
    </div>
  );
}
