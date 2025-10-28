export function getTabUrl(view: "map" | "listings", pathname: string): string {
  if (view === "listings") {
    return pathname === "/" ? "/inserate" : `${pathname}/inserate`;
  }
  return pathname.replace(/\/inserate$/, "") || "/";
}
