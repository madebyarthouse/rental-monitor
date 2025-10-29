import { Link, useLocation } from "react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import DesktopSidebar from "./desktop-sidebar";
import { cn } from "@/lib/utils";
import type { RegionHierarchy } from "@/services/region-service";
import { getTabUrl } from "./utils";
import { useFilteredUrl } from "@/hooks/use-filtered-url";
import { useMemo } from "react";
import { StatsSummary } from "./stats-summary";

export default function DesktopLayout({
  statesWithDistricts,
  children,
}: {
  statesWithDistricts: RegionHierarchy;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const isListingsView = location.pathname.includes("/inserate");
  const buildFilteredUrl = useFilteredUrl();
  const activeTitle = useMemo(() => {
    const path = location.pathname.replace(/^\/+|\/+$/g, "");
    if (!path || path === "inserate") return "Österreich";
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
      ?.districts.find((d) => (d as any).slug === districtSlug);
    return dist ? `${state.name} — ${dist.name}` : state.name;
  }, [location.pathname, statesWithDistricts]);

  return (
    <SidebarProvider defaultOpen={true}>
      <DesktopSidebar statesWithDistricts={statesWithDistricts} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-4">
          <div className="text-base md:text-lg font-semibold tracking-tight">
            {activeTitle}
          </div>
          <div className="flex gap-2">
            <Link
              to={buildFilteredUrl(getTabUrl("map", location.pathname), {
                target: "map",
              })}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors rounded-md",
                !isListingsView
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              Karte
            </Link>
            <Link
              to={buildFilteredUrl(getTabUrl("listings", location.pathname), {
                target: "listings",
              })}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors rounded-md",
                isListingsView
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              Inserate
            </Link>
          </div>
        </header>
        <StatsSummary />
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
