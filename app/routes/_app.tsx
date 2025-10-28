import { Link, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/_app";
import { RegionService } from "@/services/region-service";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export async function loader({ context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const states = await regionService.getAllStates();

  // Fetch districts for each state
  const statesWithDistricts = await Promise.all(
    states.map(async (state) => ({
      ...state,
      districts: await regionService.getDistrictsByStateId(state.id),
    }))
  );

  return { statesWithDistricts };
}

function getTabUrl(view: "map" | "listings", pathname: string): string {
  if (view === "listings") {
    return pathname === "/" ? "/inserate" : `${pathname}/inserate`;
  }
  // Remove /inserate suffix for map view
  return pathname.replace(/\/inserate$/, "") || "/";
}

function RegionAccordion({
  statesWithDistricts,
  onNavigate,
}: {
  statesWithDistricts: Route.ComponentProps["loaderData"]["statesWithDistricts"];
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentStateSlug = pathParts[0] !== "inserate" ? pathParts[0] : null;
  const currentDistrictSlug =
    pathParts.length >= 2 && pathParts[1] !== "inserate" ? pathParts[1] : null;

  const activeState = statesWithDistricts.find(
    (s) => s.slug === currentStateSlug
  );
  const activeStateValue = activeState ? [activeState.slug] : [];

  const activeItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentStateSlug, currentDistrictSlug]);

  return (
    <Accordion
      type="multiple"
      defaultValue={activeStateValue}
      className="w-full"
    >
      {statesWithDistricts.map((state) => {
        const isActive = state.slug === currentStateSlug;
        return (
          <AccordionItem key={state.id} value={state.slug}>
            <AccordionTrigger className="px-4">{state.name}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1 px-2">
                <Link
                  to={`/${state.slug}`}
                  onClick={onNavigate}
                  ref={isActive && !currentDistrictSlug ? activeItemRef : null}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                    isActive &&
                      !currentDistrictSlug &&
                      "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  )}
                >
                  Alle {state.name}
                </Link>
                {state.districts.map((district) => {
                  const isDistrictActive =
                    isActive && district.slug === currentDistrictSlug;
                  return (
                    <Link
                      key={district.id}
                      to={`/${state.slug}/${district.slug}`}
                      onClick={onNavigate}
                      ref={isDistrictActive ? activeItemRef : null}
                      className={cn(
                        "rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                        isDistrictActive &&
                          "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      )}
                    >
                      {district.name}
                    </Link>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function DesktopSidebar({
  statesWithDistricts,
}: {
  statesWithDistricts: Route.ComponentProps["loaderData"]["statesWithDistricts"];
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <img
            src="/momentum-institut-logo.png"
            alt="Momentum Institut"
            className="h-8 w-8 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6"
          />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Befristungs-Monitor</span>
            <span className="text-xs text-muted-foreground">
              Momentum Institut
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="flex-1">
          <div className="p-2 group-data-[collapsible=icon]:hidden">
            <RegionAccordion statesWithDistricts={statesWithDistricts} />
          </div>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
        <div className="p-4 text-xs text-muted-foreground">
          <Separator className="mb-4" />
          <p>© 2025 Momentum Institut</p>
          <div className="mt-2 flex gap-3">
            <a href="#" className="hover:text-foreground transition-colors">
              Über uns
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Kontakt
            </a>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function MobileLayout({
  statesWithDistricts,
  children,
}: {
  statesWithDistricts: Route.ComponentProps["loaderData"]["statesWithDistricts"];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const isListingsView = location.pathname.includes("/inserate");

  return (
    <>
      <div className="flex flex-col min-h-screen pb-32">
        <main className="flex-1">{children}</main>
      </div>

      {/* Tabs Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-background border-t border-border z-40">
        <div className="flex">
          <Link
            to={getTabUrl("map", location.pathname)}
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
            to={getTabUrl("listings", location.pathname)}
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

      {/* Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <img
            src="/momentum-institut-logo.png"
            alt="Momentum Institut"
            className="h-6 w-6"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Regionen & Filter</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <ScrollArea className="h-[60vh]">
              <RegionAccordion
                statesWithDistricts={statesWithDistricts}
                onNavigate={() => setDrawerOpen(false)}
              />
            </ScrollArea>
            <Separator className="my-4" />
            <div className="text-xs text-muted-foreground">
              <p>© 2025 Momentum Institut</p>
              <div className="mt-2 flex gap-3">
                <a href="#" className="hover:text-foreground transition-colors">
                  Über uns
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Kontakt
                </a>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function DesktopLayout({
  statesWithDistricts,
  children,
}: {
  statesWithDistricts: Route.ComponentProps["loaderData"]["statesWithDistricts"];
  children: React.ReactNode;
}) {
  const location = useLocation();
  const isListingsView = location.pathname.includes("/inserate");

  return (
    <SidebarProvider defaultOpen={true}>
      <DesktopSidebar statesWithDistricts={statesWithDistricts} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
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

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { statesWithDistricts } = loaderData;

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <DesktopLayout statesWithDistricts={statesWithDistricts}>
          <Outlet />
        </DesktopLayout>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <MobileLayout statesWithDistricts={statesWithDistricts}>
          <Outlet />
        </MobileLayout>
      </div>
    </>
  );
}
