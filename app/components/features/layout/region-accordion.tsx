import { Link, useLocation } from "react-router";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { RegionHierarchy } from "@/services/region-service";

export default function RegionAccordion({
  statesWithDistricts,
  onNavigate,
}: {
  statesWithDistricts: RegionHierarchy;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentStateSlug = pathParts[0] !== "inserate" ? pathParts[0] : null;
  const currentDistrictSlug =
    pathParts.length >= 2 && pathParts[1] !== "inserate" ? pathParts[1] : null;

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
      className="w-full"
      type="single"
      collapsible
      defaultValue={currentStateSlug ?? undefined}
      key={currentStateSlug ?? "root"}
    >
      {statesWithDistricts.map((state) => {
        const isActive = state.state.slug === currentStateSlug;
        return (
          <AccordionItem
            key={state.state.id}
            value={state.state.slug}
            className="mb-2"
          >
            <AccordionTrigger className="px-4 py-2 text-sm">
              {state.state.name}
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1 px-2 overflow-y-auto scroll-thin-primary">
                <Link
                  to={`/${state.state.slug}`}
                  onClick={onNavigate}
                  ref={isActive && !currentDistrictSlug ? activeItemRef : null}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                    isActive &&
                      !currentDistrictSlug &&
                      "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  )}
                >
                  Alle {state.state.name}
                </Link>
                {state.districts.map((district) => {
                  const isDistrictActive =
                    isActive && district.slug === currentDistrictSlug;
                  return (
                    <Link
                      key={district.id}
                      to={`/${state.state.slug}/${district.slug}`}
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
