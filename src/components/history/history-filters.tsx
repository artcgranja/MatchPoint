"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HistoryFiltersProps {
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function HistoryFilters({ sortBy, onSortChange }: HistoryFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Date</SelectItem>
          <SelectItem value="results">Results</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
