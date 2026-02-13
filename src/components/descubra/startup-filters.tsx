"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StartupFiltersProps {
  availableIndustries: string[];
  availableTags: string[];
  availableRegions: string[];
}

export function StartupFilters({
  availableIndustries,
  availableTags,
  availableRegions,
}: StartupFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const t = useTranslations("Browse");
  const tCommon = useTranslations("Common");

  const query = searchParams.get("query") ?? "";
  const status = searchParams.get("status") ?? "";
  const stage = searchParams.get("stage") ?? "";

  const [searchValue, setSearchValue] = useState(query);

  useEffect(() => {
    setSearchValue(query);
  }, [query]);

  const STATUS_OPTIONS = [
    { value: "Active", label: t("statusActive") },
    { value: "Inactive", label: t("statusInactive") },
    { value: "Acquired", label: t("statusAcquired") },
    { value: "Public", label: t("statusPublic") },
  ];

  const STAGE_OPTIONS = [
    { value: "Early", label: t("stageEarly") },
    { value: "Growth", label: t("stageGrowth") },
  ];

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/descubra?${params.toString()}`);
      });
    },
    [searchParams, router]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== query) {
        updateParams({ query: searchValue });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchValue, query, updateParams]);

  const hasFilters =
    query || status || stage ||
    searchParams.has("industries") ||
    searchParams.has("tags") ||
    searchParams.has("regions");

  const clearAll = () => {
    setSearchValue("");
    startTransition(() => {
      router.push("/descubra");
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search input */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 h-9 bg-background-secondary/50 border-border"
        />
      </div>

      {/* Industry filter */}
      {availableIndustries.length > 0 && (
        <Select
          value={searchParams.get("industries") ?? ""}
          onValueChange={(v) => updateParams({ industries: v })}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder={t("filterIndustry")} />
          </SelectTrigger>
          <SelectContent>
            {availableIndustries.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Tags filter */}
      {availableTags.length > 0 && (
        <Select
          value={searchParams.get("tags") ?? ""}
          onValueChange={(v) => updateParams({ tags: v })}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder={t("filterTag")} />
          </SelectTrigger>
          <SelectContent>
            {availableTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Status filter */}
      <Select
        value={status}
        onValueChange={(v) => updateParams({ status: v })}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder={t("filterStatus")} />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Stage filter */}
      <Select
        value={stage}
        onValueChange={(v) => updateParams({ stage: v })}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder={t("filterStage")} />
        </SelectTrigger>
        <SelectContent>
          {STAGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Region filter */}
      {availableRegions.length > 0 && (
        <Select
          value={searchParams.get("regions") ?? ""}
          onValueChange={(v) => updateParams({ regions: v })}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder={t("filterRegion")} />
          </SelectTrigger>
          <SelectContent>
            {availableRegions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear all */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-foreground-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          {tCommon("clear")}
        </Button>
      )}
    </div>
  );
}
