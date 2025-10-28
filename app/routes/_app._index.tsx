import type { Route } from "./+types/_app._index";
import { RegionService } from "@/services/region-service";

export async function loader({ params, context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const { state: stateSlug, district: districtSlug } = params;

  if (!stateSlug) {
    // Austria level: fetch all states
    const states = await regionService.getAllStates();
    return { level: "country" as const, regions: states };
  }

  const stateData = await regionService.getStateWithDistricts(stateSlug);
  if (!stateData) throw new Response("Not Found", { status: 404 });

  if (!districtSlug) {
    // State level: return state + districts
    return {
      level: "state" as const,
      state: stateData.state,
      districts: stateData.districts,
    };
  }

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

export default function MapView({ loaderData }: Route.ComponentProps) {
  return (
    <div className="p-8">
      <div className="text-2xl font-bold mb-4">MAP</div>
      <div className="text-sm text-muted-foreground">
        <p>Level: {loaderData.level}</p>
        {loaderData.level === "country" && (
          <p>Regions: {loaderData.regions.length} states</p>
        )}
        {loaderData.level === "state" && (
          <>
            <p>State: {loaderData.state.name}</p>
            <p>Districts: {loaderData.districts.length}</p>
          </>
        )}
        {loaderData.level === "district" && (
          <>
            <p>State: {loaderData.state.name}</p>
            <p>District: {loaderData.district.name}</p>
          </>
        )}
      </div>
    </div>
  );
}
