"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  Building2,
  CheckCircle,
  TrendingUp,
  Pencil,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyData } from "./company-profile";

interface CompanyHeaderProps {
  company: CompanyData;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: { name: string; oneLiner: string }) => Promise<void>;
}

export function CompanyHeader({
  company,
  isEditing,
  onEdit,
  onCancel,
  onSave,
}: CompanyHeaderProps) {
  const t = useTranslations("CompanyProfile");
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: company.name, oneLiner: company.oneLiner });

  const handleEdit = () => {
    setForm({ name: company.name, oneLiner: company.oneLiner });
    onEdit();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(form);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlassCard variant="highlight">
      <div className="flex items-start gap-4">
        {/* Logo */}
        {company.smallLogoUrl ? (
          <img
            src={company.smallLogoUrl}
            alt={company.name}
            className="h-16 w-16 shrink-0 rounded-xl object-contain bg-white/5 border border-border"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-elevated border border-border">
            <Building2 className="h-8 w-8 text-foreground-muted" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="header-name">{t("name")}</Label>
                      <Input
                        id="header-name"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder={t("namePlaceholder")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="header-oneliner">{t("oneLiner")}</Label>
                      <Input
                        id="header-oneliner"
                        value={form.oneLiner}
                        onChange={(e) => setForm((prev) => ({ ...prev, oneLiner: e.target.value }))}
                        placeholder={t("oneLinerPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={onCancel} disabled={isSaving}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving || !form.name || !form.oneLiner}>
                      {isSaving ? t("saving") : t("save")}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-heading text-xl font-bold tracking-tight">
                    {company.name}
                  </h2>
                  <Button variant="ghost" size="icon-sm" onClick={handleEdit}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 text-sm text-foreground-muted">
                  {company.oneLiner}
                </p>

                {/* Status badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {company.status === "Active" ? (
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      {t("statusActive")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                      {company.status || t("statusInactive")}
                    </Badge>
                  )}
                  {company.stage && (
                    <Badge variant="outline" className="border-border text-foreground-muted">
                      <TrendingUp className="h-3 w-3" />
                      {company.stage}
                    </Badge>
                  )}
                  {company.topCompany && (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                      Top Company
                    </Badge>
                  )}
                  {company.batch && (
                    <Badge variant="outline" className="border-border text-foreground-muted">
                      {company.batch}
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}
