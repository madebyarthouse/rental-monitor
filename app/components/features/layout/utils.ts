import type { RegionHierarchy } from "@/services/region-service";

export function getTabUrl(view: "map" | "listings", pathname: string): string {
  const current = pathname || "/";

  // If currently on Methodik, switching tabs goes to root-only variants
  if (current === "/methodik") {
    return view === "listings" ? "/inserate" : "/";
  }

  if (view === "listings") {
    if (current === "/") return "/inserate";
    // Append /inserate when not already present
    return current.endsWith("/inserate") ? current : `${current}/inserate`;
  }

  // view === "map" → strip trailing /inserate
  return current.replace(/\/inserate$/, "") || "/";
}

export function getActiveRegionTitle(
  statesWithDistricts: RegionHierarchy,
  pathname: string
): string {
  const path = pathname.replace(/^\/+|\/+$/g, "");
  if (!path || path === "inserate") return "Österreich";
  if (path === "methodik") return "Methodik";
  const parts = path.split("/");
  const stateSlug = parts[0];
  const districtSlug =
    parts[1] && parts[1] !== "inserate" ? parts[1] : undefined;
  const state = statesWithDistricts.find(
    (s) => s.state.slug === stateSlug
  )?.state;
  if (!state) return "Österreich";
  if (!districtSlug) return state.name;
  const dist = statesWithDistricts
    .find((s) => s.state.slug === stateSlug)
    ?.districts.find((d) => d.slug === districtSlug);
  return dist ? `${state.name} — ${dist.name}` : state.name;
}
