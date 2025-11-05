import * as React from "react";
import { useLocation, useSearchParams } from "react-router";

export type FilterTarget = "map" | "listings";

const COMMON_FILTER_KEYS = [
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
  "limited",
  "unlimited",
  "platforms",

  "metric",
] as const;

const LISTINGS_EXTRA_KEYS = ["sortBy", "order", "perPage"] as const;

const MAP_EXTRA_KEYS = ["metric"] as const;

export function useFilteredUrl() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  return React.useCallback(
    (
      targetPath: string,
      options?: {
        target?: FilterTarget;
      }
    ) => {
      const target: FilterTarget =
        options?.target ??
        (targetPath.includes("/inserate") ? "listings" : "map");

      const next = new URLSearchParams();

      // Preserve common filters
      for (const key of COMMON_FILTER_KEYS) {
        const value = searchParams.get(key);
        if (value != null && value !== "") next.set(key, value);
      }

      if (target === "listings") {
        // Preserve listings-specific options (sorting, etc.)
        for (const key of LISTINGS_EXTRA_KEYS) {
          const value = searchParams.get(key);
          if (value != null && value !== "") next.set(key, value);
        }
        // Keep current page if present (only reset when switching away from listings)
        const page = searchParams.get("page");
        if (page) next.set("page", page);
      } else {
        // target is map → preserve map-specific options
        for (const key of MAP_EXTRA_KEYS) {
          const value = searchParams.get(key);
          if (value != null && value !== "") next.set(key, value);
        }
        // If switching away from listings, reset pagination
        if (location.pathname.includes("/inserate")) {
          next.delete("page");
          next.delete("perPage");
        }
      }

      const query = next.toString();
      return query ? `${targetPath}?${query}` : targetPath;
    },
    [searchParams, location.pathname]
  );
}
