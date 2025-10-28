import type { Route } from "./+types/_app.$state.$district._index";
import { RegionService } from "@/services/region-service";

export async function loader({ params, context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const { state: stateSlug, district: districtSlug } = params;

  const stateData = await regionService.getStateWithDistricts(stateSlug);
  if (!stateData) throw new Response("Not Found", { status: 404 });

  // District level: return state bounds + district
  const district = stateData.districts.find((d) => d.slug === districtSlug);
  if (!district) throw new Response("Not Found", { status: 404 });

  return {
    level: "district" as const,
    state: stateData.state,
    district,
    districts: stateData.districts,
  };
}

export default function DistrictMapView({ loaderData }: Route.ComponentProps) {
  return (
    <div className="p-8">
      <div className="text-2xl font-bold mb-4">MAP</div>
      <div className="text-sm text-muted-foreground">
        <p>Level: {loaderData.level}</p>
        <p>State: {loaderData.state.name}</p>
        <p>District: {loaderData.district.name}</p>
      </div>
    </div>
  );
}
