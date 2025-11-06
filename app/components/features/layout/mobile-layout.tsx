import { Link, useLocation, useNavigation } from "react-router";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import RegionAccordion from "./region-accordion";
import type { RegionHierarchy } from "@/services/region-service";
import { getActiveRegionTitle, getTabUrl } from "./utils";
import { useFilteredUrl } from "@/hooks/use-filtered-url";
import { FiltersAccordion } from "../filters/filters-accordion";
import { StatsSummary } from "./stats-summary";
import { Credits } from "./credits";
import { SocialBar } from "./social-bar";
import { LegalLinks } from "./legal-links";

export default function MobileLayout({
  statesWithDistricts,
  children,
}: {
  statesWithDistricts: RegionHierarchy;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isListingsView = location.pathname.includes("/inserate");
  const isMethodikView = location.pathname === "/methodik";
  const buildFilteredUrl = useFilteredUrl();
  const activeTitle = useMemo(
    () => getActiveRegionTitle(statesWithDistricts, location.pathname),
    [statesWithDistricts, location.pathname]
  );
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
    return;
  }, [menuOpen]);

  return (
    <>
      {/* Sticky top header: Logo + menu toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-1100 border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 h-14 gap-4">
          <Link
            to={buildFilteredUrl("/", { target: "map" })}
            className="block h-full py-2 order-2 md:order-1"
          >
            <img
              src="/momentum-institut-logo.png"
              alt="Momentum Institut"
              width={1700}
              height={441}
              className="h-full w-auto max-w-[220px]"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menü öffnen"
            className="shrink-0 order-1 md:order-2 -ml-1.5"
          >
            {menuOpen ? (
              <X className="size-8" strokeWidth={2} />
            ) : (
              <Menu className="size-8" strokeWidth={2} />
            )}
          </Button>
        </div>

        {/* Under-header area: either region bar (default) or fade-in menu panel */}
        {!menuOpen ? (
          <div className="flex h-12 items-center px-4 border-t border-border bg-background">
            <div className="font-medium tracking-tight truncate text-[clamp(0.7875rem,5vw,1.5rem)]">
              {activeTitle}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "border-t border-border bg-background overflow-hidden",
              "transition-opacity duration-200 ease-out",
              menuOpen ? "opacity-100" : "opacity-0"
            )}
            style={{ height: "calc(100dvh - 60px)" }}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-auto scrollbar-thin scrollbar-track-transparent  space-y-4">
                <FiltersAccordion />
                <div className="px-4">
                  <RegionAccordion
                    statesWithDistricts={statesWithDistricts}
                    onNavigate={() => setMenuOpen(false)}
                  />
                </div>
              </div>
              <div className="border-t py-5 flex text-base flex-col gap-3">
                <div className="mb-3 text-xs text-muted-foreground">
                  <SocialBar size={24} />
                </div>
                <Credits />
                <LegalLinks />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content spacing accounts for header + region bar */}
      <div className="flex flex-col min-h-screen pt-[113px] pb-20">
        <main className="flex-1">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-20"
              role="status"
              aria-label="Lädt"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Bottom sticky tabs: Map, Listings, Methodik */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-1000">
        <div className="flex">
          <Link
            to={buildFilteredUrl(getTabUrl("map", location.pathname), {
              target: "map",
            })}
            className={cn(
              "flex-1 py-3 text-center text-xl font-medium transition-colors",
              !isListingsView && !isMethodikView
                ? "bg-primary text-primary-foreground"
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
              "flex-1 py-3 text-center text-xl font-medium transition-colors",
              isListingsView
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Inserate
          </Link>
          <Link
            to="/methodik"
            className={cn(
              "flex-1 py-3 text-center text-xl font-medium transition-colors",
              isMethodikView
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Methodik
          </Link>
        </div>
      </div>
    </>
  );
}
