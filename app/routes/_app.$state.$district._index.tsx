import type { Route } from "./+types/_app.$state.$district._index";
import { RegionService } from "@/services/region-service";
import MapViewBasic from "@/components/features/map/map-view";

export async function loader({ params, context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const { state: stateSlug, district: districtSlug } = params;

  // Fetch state and districts for map context
  const stateData = await regionService.getStateWithDistricts(stateSlug);
  if (!stateData) throw new Response("Not Found", { status: 404 });

  // Fetch district independently for chart/statistics context
  const district = await regionService.getRegionBySlug(districtSlug);
  if (!district || district.parentId !== String(stateData.state.id)) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    level: "district" as const,
    // map context
    state: stateData.state,
    districts: stateData.districts,
    // chart/statistics context
    district,
  };
}

export default function DistrictMapView({ loaderData }: Route.ComponentProps) {
  return (
    <MapViewBasic>
      <p>Level: {loaderData.level}</p>
      <p>State: {loaderData.state.name}</p>
      <p>District: {loaderData.district.name}</p>
    </MapViewBasic>
  );
}
