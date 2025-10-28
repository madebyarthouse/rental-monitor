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

export default function DesktopLayout({
  statesWithDistricts,
  children,
}: {
  statesWithDistricts: RegionHierarchy;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const isListingsView = location.pathname.includes("/inserate");

  return (
    <SidebarProvider defaultOpen={true}>
      <DesktopSidebar statesWithDistricts={statesWithDistricts} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <div className="flex gap-4">
            <Link
              to={getTabUrl("map", location.pathname)}
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
              to={getTabUrl("listings", location.pathname)}
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
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
