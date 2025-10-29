import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActiveFilters = {
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  limited?: boolean;
  unlimited?: boolean;
  rooms?: number;
  platforms?: string[];
};

export function FilterChips({
  filters,
  onRemove,
  className,
  size = "sm",
}: {
  filters: ActiveFilters;
  onRemove?: (key: keyof ActiveFilters) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const chips: Array<{ key: keyof ActiveFilters; label: string }> = [];
  if (filters.minPrice != null)
    chips.push({ key: "minPrice", label: `≥ ${filters.minPrice}€` });
  if (filters.maxPrice != null)
    chips.push({ key: "maxPrice", label: `≤ ${filters.maxPrice}€` });
  if (filters.minArea != null)
    chips.push({ key: "minArea", label: `≥ ${filters.minArea} m²` });
  if (filters.maxArea != null)
    chips.push({ key: "maxArea", label: `≤ ${filters.maxArea} m²` });
  if (filters.rooms != null)
    chips.push({ key: "rooms", label: `${filters.rooms} Zimmer` });
  if (filters.limited && !filters.unlimited)
    chips.push({ key: "limited", label: "Befristet" });
  if (filters.unlimited && !filters.limited)
    chips.push({ key: "unlimited", label: "Unbefristet" });
  if (filters.platforms && filters.platforms.length)
    chips.push({ key: "platforms", label: filters.platforms.join(", ") });

  if (!chips.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onRemove && onRemove(c.key)}
          className={cn(
            "inline-flex items-center gap-1 rounded bg-secondary text-foreground hover:bg-secondary/80",
            size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]"
          )}
        >
          <span>{c.label}</span>
          {onRemove && <X className="size-3" />}
        </button>
      ))}
    </div>
  );
}
