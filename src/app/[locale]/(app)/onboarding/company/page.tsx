"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { apiPost } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scaleIn } from "@/lib/motion";

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

export default function CompanyOnboardingPage() {
  const t = useTranslations("CompanyProfile");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    oneLiner: "",
    longDescription: "",
    website: "",
    industry: "",
    contactEmail: user?.email ?? "",
    location: "",
  });

  useEffect(() => {
    if (!user || user.role !== "builder") {
      router.replace("/");
    }
  }, [user, router]);

  if (!user || user.role !== "builder") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await apiPost("/builder/company", form);
      router.push("/");
    } catch {
      setIsSubmitting(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isValid = form.name && form.oneLiner && form.industry && form.contactEmail;

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-4">
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="glass w-full max-w-lg space-y-6 rounded-xl p-8"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-foreground-muted">{t("subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")} *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={t("namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oneLiner">{t("oneLiner")} *</Label>
            <Input
              id="oneLiner"
              value={form.oneLiner}
              onChange={(e) => update("oneLiner", e.target.value)}
              placeholder={t("oneLinerPlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longDescription">{t("description")}</Label>
            <Textarea
              id="longDescription"
              value={form.longDescription}
              onChange={(e) => update("longDescription", e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industry">{t("industry")} *</Label>
              <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                <SelectTrigger id="industry">
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

            <div className="space-y-2">
              <Label htmlFor="website">{t("website")}</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">{t("contactEmail")} *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t("location")}</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder={t("locationPlaceholder")}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!isValid || isSubmitting}>
            {isSubmitting ? t("saving") : t("save")}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
