"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Building2, Loader2 } from "lucide-react";
import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { staggerContainer, cardEntrance } from "@/lib/motion";
import { EmptyState } from "@/components/ui/empty-state";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CompanyHeader } from "./company-header";
import { CompanyStatusBanner } from "./company-status-banner";
import { AboutSection } from "./sections/about-section";
import { ContactSection } from "./sections/contact-section";
import { TeamSection } from "./sections/team-section";
import { TagsSection } from "./sections/tags-section";

export interface CompanyData {
  id: number;
  name: string;
  slug: string;
  oneLiner: string;
  longDescription: string;
  website: string;
  smallLogoUrl: string;
  allLocations: string;
  teamSize: number;
  industry: string;
  subindustry: string;
  industries: string[];
  tags: string[];
  batch: string;
  status: string;
  stage: string;
  regions: string[];
  topCompany: boolean;
  isHiring: boolean;
  nonprofit: boolean;
  launchedAt: number | null;
  ycUrl: string;
  contactEmail: string | null;
}

type EditingSection = "identity" | "about" | "contact" | null;

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

export function CompanyProfile() {
  const t = useTranslations("CompanyProfile");
  const user = useAuthStore((s) => s.user);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompany, setHasCompany] = useState(false);
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.role !== "builder") return;
    apiGet<CompanyData>("/builder/company")
      .then((data) => {
        setCompany(data);
        setHasCompany(true);
      })
      .catch(() => {
        setHasCompany(false);
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  const startEditing = (section: EditingSection) => {
    if (editingSection && editingSection !== section) {
      toast.error(t("finishEditingFirst"));
      return;
    }
    setEditingSection(section);
  };

  const cancelEditing = () => setEditingSection(null);

  const saveSection = async (data: Record<string, unknown>) => {
    const updated = await apiPut<CompanyData>("/builder/company", data);
    setCompany(updated);
    setEditingSection(null);
    toast.success(t("sectionSaved"));
  };

  const toggleHiring = async (value: boolean) => {
    try {
      const updated = await apiPut<CompanyData>("/builder/company", { isHiring: value });
      setCompany(updated);
      toast.success(t("hiringSaved"));
    } catch {
      toast.error(t("saveError"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-highlight" />
      </div>
    );
  }

  if (!hasCompany || !company) {
    return (
      <>
        <EmptyState
          icon={Building2}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Button onClick={() => setCreateDialogOpen(true)}>
              {t("createCompany")}
            </Button>
          }
        />
        <CreateCompanyDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={(data) => {
            setCompany(data);
            setHasCompany(true);
            setCreateDialogOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      {/* Status banner */}
      <motion.div variants={cardEntrance}>
        <CompanyStatusBanner status={company.status} />
      </motion.div>

      {/* Header */}
      <motion.div variants={cardEntrance}>
        <CompanyHeader
          company={company}
          isEditing={editingSection === "identity"}
          onEdit={() => startEditing("identity")}
          onCancel={cancelEditing}
          onSave={async (data) => {
            await saveSection(data);
          }}
        />
      </motion.div>

      {/* About */}
      <motion.div variants={cardEntrance}>
        <AboutSection
          company={company}
          isEditing={editingSection === "about"}
          onEdit={() => startEditing("about")}
          onCancel={cancelEditing}
          onSave={async (data) => {
            await saveSection(data);
          }}
        />
      </motion.div>

      {/* Contact & Location */}
      <motion.div variants={cardEntrance}>
        <ContactSection
          company={company}
          isEditing={editingSection === "contact"}
          onEdit={() => startEditing("contact")}
          onCancel={cancelEditing}
          onSave={async (data) => {
            await saveSection(data);
          }}
        />
      </motion.div>

      {/* Team */}
      <motion.div variants={cardEntrance}>
        <TeamSection
          teamSize={company.teamSize}
          isHiring={company.isHiring}
          onToggleHiring={toggleHiring}
        />
      </motion.div>

      {/* Tags & Categories */}
      <motion.div variants={cardEntrance}>
        <TagsSection
          industries={company.industries}
          tags={company.tags}
        />
      </motion.div>
    </motion.div>
  );
}

// --- Create Company Dialog ---

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (company: CompanyData) => void;
}

function CreateCompanyDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCompanyDialogProps) {
  const t = useTranslations("CompanyProfile");
  const user = useAuthStore((s) => s.user);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    oneLiner: "",
    longDescription: "",
    website: "",
    industry: "",
    contactEmail: user?.email ?? "",
    location: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isValid = form.name && form.oneLiner && form.industry && form.contactEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSaving) return;
    setIsSaving(true);
    try {
      const created = await apiPost<CompanyData>("/builder/company", form);
      toast.success(t("saved"));
      onCreated(created);
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("createCompanyTitle")}</DialogTitle>
          <DialogDescription>{t("createCompanyDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-name">{t("name")} *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={t("namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-oneliner">{t("oneLiner")} *</Label>
            <Input
              id="create-oneliner"
              value={form.oneLiner}
              onChange={(e) => update("oneLiner", e.target.value)}
              placeholder={t("oneLinerPlaceholder")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-description">{t("description")}</Label>
            <Textarea
              id="create-description"
              value={form.longDescription}
              onChange={(e) => update("longDescription", e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-industry">{t("industry")} *</Label>
              <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                <SelectTrigger id="create-industry">
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

            <div className="space-y-1.5">
              <Label htmlFor="create-website">{t("website")}</Label>
              <Input
                id="create-website"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-email">{t("contactEmail")} *</Label>
              <Input
                id="create-email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-location">{t("location")}</Label>
              <Input
                id="create-location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder={t("locationPlaceholder")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!isValid || isSaving}>
              {isSaving ? t("saving") : t("createCompany")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
