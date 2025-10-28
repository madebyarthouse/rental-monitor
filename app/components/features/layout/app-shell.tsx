import DesktopLayout from "./desktop-layout";
import MobileLayout from "./mobile-layout";
import type { RegionHierarchy } from "@/services/region-service";

export default function AppShell({
  statesWithDistricts,
  children,
}: {
  statesWithDistricts: RegionHierarchy;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="hidden md:block">
        <DesktopLayout statesWithDistricts={statesWithDistricts}>
          {children}
        </DesktopLayout>
      </div>
      <div className="md:hidden">
        <MobileLayout statesWithDistricts={statesWithDistricts}>
          {children}
        </MobileLayout>
      </div>
    </>
  );
}
