import type { Route } from "./+types/_app.$state._index";
import { RegionService } from "@/services/region-service";
import MapViewBasic from "@/components/features/map/map-view";

export async function loader({ params, context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const { state: stateSlug } = params;

  const stateData = await regionService.getStateWithDistricts(stateSlug);
  if (!stateData) throw new Response("Not Found", { status: 404 });

  // State level: return state + districts
  return {
    level: "state" as const,
    state: stateData.state,
    districts: stateData.districts,
  };
}

export default function StateMapView({ loaderData }: Route.ComponentProps) {
  return (
    <MapViewBasic>
      <p>Level: {loaderData.level}</p>
      <p>State: {loaderData.state.name}</p>
      <p>Districts: {loaderData.districts.length}</p>
    </MapViewBasic>
  );
}
