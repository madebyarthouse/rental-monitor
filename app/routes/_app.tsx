import { Link, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/_app";
import { RegionService } from "@/services/region-service";
import AppShell from "@/components/features/layout/app-shell";

export async function loader({ context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const statesWithDistricts = await regionService.getStatesWithDistricts();
  return { statesWithDistricts };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { statesWithDistricts } = loaderData;
  return (
    <AppShell statesWithDistricts={statesWithDistricts}>
      <Outlet />
    </AppShell>
  );
}
