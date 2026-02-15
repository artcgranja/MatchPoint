"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanySection } from "../company-section";
import type { CompanyData } from "../company-profile";

const INDUSTRIES = [
  "B2B",
  "Consumer",
  "Education",
  "Fintech",
  "Government",
  "Healthcare",
  "Industrials",
  "Real Estate and Construction",
];

interface AboutSectionProps {
  company: CompanyData;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: { longDescription: string; industry: string }) => Promise<void>;
}

export function AboutSection({
  company,
  isEditing,
  onEdit,
  onCancel,
  onSave,
}: AboutSectionProps) {
  const t = useTranslations("CompanyProfile");
  const [form, setForm] = useState({
    longDescription: company.longDescription,
    industry: company.industry,
  });

  const handleEdit = () => {
    setForm({ longDescription: company.longDescription, industry: company.industry });
    onEdit();
  };

  return (
    <CompanySection
      title={t("aboutSection")}
      description={t("aboutDescription")}
      isEditing={isEditing}
      onEdit={handleEdit}
      onCancel={onCancel}
      onSave={() => onSave(form)}
      editContent={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="about-description">{t("description")}</Label>
            <Textarea
              id="about-description"
              value={form.longDescription}
              onChange={(e) => setForm((prev) => ({ ...prev, longDescription: e.target.value }))}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="about-industry">{t("industry")} *</Label>
            <Select
              value={form.industry}
              onValueChange={(v) => setForm((prev) => ({ ...prev, industry: v }))}
            >
              <SelectTrigger id="about-industry">
                <SelectValue placeholder={t("industryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    >
      {/* View mode */}
      <div className="space-y-4">
        {company.longDescription ? (
          <p className="text-sm leading-relaxed text-foreground/90">
            {company.longDescription}
          </p>
        ) : (
          <p className="text-sm text-foreground-muted italic">
            {t("noDescription")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          {company.industry && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-foreground-muted" />
              <span className="text-sm text-foreground/90">
                {company.industry}
                {company.subindustry && ` / ${company.subindustry}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </CompanySection>
  );
}
