import { Link, useLocation } from "react-router";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import RegionAccordion from "./region-accordion";
import type { RegionHierarchy } from "@/services/region-service";
import { getTabUrl } from "./utils";
import { useFilteredUrl } from "@/hooks/use-filtered-url";
import { FiltersAccordion } from "../filters/filters-accordion";
import { StatsSummary } from "./stats-summary";

export default function MobileLayout({
  statesWithDistricts,
  children,
}: {
  statesWithDistricts: RegionHierarchy;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const isListingsView = location.pathname.includes("/inserate");
  const buildFilteredUrl = useFilteredUrl();

  return (
    <>
      {/* Top header with title */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-12 items-center border-b border-border bg-background px-4">
        <div className="text-sm font-semibold tracking-tight">Mietmonitor</div>
      </div>
      <div className="flex flex-col min-h-screen pt-12 pb-32">
        <StatsSummary />
        <main className="flex-1">{children}</main>
      </div>
      <div className="md:hidden fixed bottom-20 left-0 right-0 bg-background border-t border-border z-40">
        <div className="flex">
          <Link
            to={buildFilteredUrl(getTabUrl("map", location.pathname), {
              target: "map",
            })}
            className={cn(
              "flex-1 py-3 text-center text-sm font-medium transition-colors",
              !isListingsView
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Karte
          </Link>
          <Link
            to={buildFilteredUrl(getTabUrl("listings", location.pathname), {
              target: "listings",
            })}
            className={cn(
              "flex-1 py-3 text-center text-sm font-medium transition-colors",
              isListingsView
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Inserate
          </Link>
        </div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 px-4 justify-between">
        <div className="flex items-center justify-between px-4 py-3 w-full gap-5">
          <Link to="/">
            <img
              src="/momentum-institut-logo.png"
              alt="Momentum Institut"
              width={1700}
              height={441}
              className="max-w-[250px] grow"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
            className="shrink-0 block"
          >
            <Menu className="size-10" strokeWidth={2} />
          </Button>
        </div>
      </div>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="z-1000">
          <DrawerHeader>
            <DrawerTitle>Regionen & Filter</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <div className="max-h-[60vh] overflow-auto">
              <FiltersAccordion className="mb-3" />
              <RegionAccordion
                statesWithDistricts={statesWithDistricts}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
