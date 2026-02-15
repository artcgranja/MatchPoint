"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, ExternalLink, MapPin, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CompanySection } from "../company-section";
import type { CompanyData } from "../company-profile";

interface ContactSectionProps {
  company: CompanyData;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: {
    contactEmail: string;
    website: string;
    location: string;
  }) => Promise<void>;
}

export function ContactSection({
  company,
  isEditing,
  onEdit,
  onCancel,
  onSave,
}: ContactSectionProps) {
  const t = useTranslations("CompanyProfile");
  const [form, setForm] = useState({
    contactEmail: company.contactEmail ?? "",
    website: company.website,
    location: company.allLocations,
  });

  const handleEdit = () => {
    setForm({
      contactEmail: company.contactEmail ?? "",
      website: company.website,
      location: company.allLocations,
    });
    onEdit();
  };

  return (
    <CompanySection
      title={t("contactSection")}
      description={t("contactDescription")}
      isEditing={isEditing}
      onEdit={handleEdit}
      onCancel={onCancel}
      onSave={() => onSave(form)}
      editContent={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-email">{t("contactEmail")} *</Label>
            <Input
              id="contact-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-website">{t("website")}</Label>
            <Input
              id="contact-website"
              value={form.website}
              onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-location">{t("location")}</Label>
            <Input
              id="contact-location"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder={t("locationPlaceholder")}
            />
          </div>
        </div>
      }
    >
      {/* View mode */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {company.contactEmail && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-foreground-muted" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {t("contactEmail")}
              </h4>
            </div>
            <p className="text-sm text-foreground/90">{company.contactEmail}</p>
          </div>
        )}

        {company.website && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5 text-foreground-muted" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {t("website")}
              </h4>
            </div>
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-highlight hover:underline"
            >
              {company.website}
            </a>
          </div>
        )}

        {company.allLocations && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-foreground-muted" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {t("location")}
              </h4>
            </div>
            <p className="text-sm text-foreground/90">{company.allLocations}</p>
          </div>
        )}

        {company.regions.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-foreground-muted" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {t("regions")}
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {company.regions.map((r) => (
                <Badge key={r} variant="outline" className="text-xs">
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </CompanySection>
  );
}
