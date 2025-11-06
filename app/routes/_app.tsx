import { Link, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/_app";
import { RegionService } from "@/services/region-service";
import AppShell from "@/components/features/layout/app-shell";
import { cacheHeader } from "pretty-cache-header";

export async function loader({ context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const statesWithDistricts = await regionService.getStatesWithDistricts();
  return { statesWithDistricts };
}

export function headers() {
  return {
    "Cache-Control": cacheHeader({
      public: true,
      maxAge: "1d",
      sMaxage: "12h", // 12 hours for shared caches (CDN)
      staleWhileRevalidate: "1w", // 1 week SWR
    }),
  };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { statesWithDistricts } = loaderData;
  return (
    <AppShell statesWithDistricts={statesWithDistricts}>
      <Outlet />
    </AppShell>
  );
}
