"use client";

import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useComparisonStore } from "@/stores/comparison-store";
import type { Startup } from "@/types";

interface StartupSelectorProps {
  allStartups: Startup[];
  selectedStartups: Startup[];
}

export function StartupSelector({
  allStartups,
  selectedStartups,
}: StartupSelectorProps) {
  const { addStartup, removeStartup, clearAll, startupIds } =
    useComparisonStore();
  const available = allStartups.filter((s) => !startupIds.includes(s.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Selected ({startupIds.length}/4)
        </h3>
        {startupIds.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedStartups.map((s) => (
          <Badge
            key={s.id}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {s.name}
            <button
              onClick={() => removeStartup(s.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {startupIds.length < 4 && available.length > 0 && (
        <Select onValueChange={(v) => addStartup(v)}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <SelectValue placeholder="Add a startup..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {available.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.aiAnalysis.matchScore}%)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
