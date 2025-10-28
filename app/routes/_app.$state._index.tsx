import type { Route } from "./+types/_app.$state._index";
import { RegionService } from "@/services/region-service";

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
    <div className="p-8">
      <div className="text-2xl font-bold mb-4">MAP</div>
      <div className="text-sm text-muted-foreground">
        <p>Level: {loaderData.level}</p>
        <p>State: {loaderData.state.name}</p>
        <p>Districts: {loaderData.districts.length}</p>
      </div>
    </div>
  );
}
