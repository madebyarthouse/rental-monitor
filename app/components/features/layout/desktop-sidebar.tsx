import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import RegionAccordion from "./region-accordion";
import type { RegionHierarchy } from "@/services/region-service";
import { SocialBar } from "./social-bar";
import { Credits } from "./credits";
import { Link } from "react-router";

export default function DesktopSidebar({
  statesWithDistricts,
}: {
  statesWithDistricts: RegionHierarchy;
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center w-full gap-2 px-2 py-2">
          <Link to="/" className="group-data-[collapsible=icon]:hidden">
            <img
              src="/momentum-institut-logo.png"
              alt="Momentum Institut"
              width={1700}
              height={441}
              className="max-w-[300px] w-full grow"
            />
          </Link>
          <SidebarTrigger className="shrink-0 size-8" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="p-2 group-data-[collapsible=icon]:hidden">
          <RegionAccordion statesWithDistricts={statesWithDistricts} />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
        <div className="p-4 flex flex-col gap-3 text-xs text-muted-foreground">
          <SocialBar />
          <Credits />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
