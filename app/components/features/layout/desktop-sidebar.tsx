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

export default function DesktopSidebar({
  statesWithDistricts,
}: {
  statesWithDistricts: RegionHierarchy;
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center w-full gap-2 px-2 py-2">
          <img
            src="/momentum-institut-logo.png"
            alt="Momentum Institut"
            width={1700}
            height={441}
            className="max-w-[300px] w-full grow group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-auto"
          />
          <Separator orientation="vertical" className="h-6" />
          <SidebarTrigger className="shrink-0 w-4 h-4" />
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
