import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import RegionAccordion from "./region-accordion";
import type { RegionHierarchy } from "@/services/region-service";
import { SocialBar } from "./social-bar";
import { Credits } from "./credits";
import { Link } from "react-router";
import { FiltersAccordion } from "../filters/filters-accordion";

export default function DesktopSidebar({
  statesWithDistricts,
}: {
  statesWithDistricts: RegionHierarchy;
}) {
  return (
    <Sidebar collapsible="icon" className="group-data-[state=collapsed]:w-16">
      <SidebarHeader className="sticky top-0 z-50 bg-background border-b border-sidebar-border h-16 group-data-[state=collapsed]:w-16">
        <div className="flex h-full items-center justify-between w-full  gap-2 px-2">
          <Link
            to="/"
            className="group-data-[state=collapsed]:hidden h-full block py-1"
          >
            <img
              src="/momentum-institut-logo.png"
              alt="Momentum Institut"
              width={1700}
              height={441}
              className="h-full w-auto max-w-[250px] grow"
            />
          </Link>
          <SidebarTrigger className="size-8 shrink" />
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <div className="p-2">
          <div className="group-data-[state=collapsed]:hidden">
            <FiltersAccordion />
            <h3 className="px-2 pb-1 text-muted-foreground">Regionen</h3>
            <div className="px-2">
              <RegionAccordion statesWithDistricts={statesWithDistricts} />
            </div>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="sticky bottom-0 z-10 bg-background border-t border-sidebar-border group-data-[state=collapsed]:hidden">
        <div className="p-4 flex flex-col gap-3 text-xs text-muted-foreground">
          <SocialBar />
          <Credits />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
