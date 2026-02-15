"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Pencil, X } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface CompanySectionProps {
  title: string;
  description: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  canEdit?: boolean;
  children: React.ReactNode;
  editContent?: React.ReactNode;
}

export function CompanySection({
  title,
  description,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  canEdit = true,
  children,
  editContent,
}: CompanySectionProps) {
  const t = useTranslations("CompanyProfile");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlassCard>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-foreground-muted">{description}</p>
        </div>
        {canEdit && !isEditing && (
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("saving") : t("save")}
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing && editContent ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {editContent}
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
