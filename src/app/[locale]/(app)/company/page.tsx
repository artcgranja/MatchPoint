"use client";

import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { CompanyProfile } from "@/components/company/company-profile";

export default function CompanyProfilePage() {
  const t = useTranslations("CompanyProfile");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      <SectionHeader title={t("title")} description={t("subtitle")} />
      <CompanyProfile />
    </div>
  );
}
