import type { Route } from "./+types/_app.$state._index";
import { RegionService } from "@/services/region-service";
import MapView from "@/components/features/map/map-view.client";
import { ClientOnly } from "@/components/client-only";

type BoundsTuple = [[number, number], [number, number]];
type RegionDTO = {
  id: number;
  name: string;
  slug: string;
  geojson?: unknown;
  bounds?: BoundsTuple;
};

export async function loader({ params, context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const { state: stateSlug } = params;

  const stateData = await regionService.getStateWithDistricts(stateSlug);
  if (!stateData) throw new Response("Not Found", { status: 404 });

  return {
    state: {
      name: stateData.state.name,
      slug: stateData.state.slug,
      bounds: stateData.state.bounds,
    },
    districts: stateData.districts.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      geojson: d.geojson,
    })),
  };
}

export default function StateMapView(props: Route.ComponentProps) {
  return (
    <ClientOnly>
      {() => (
        <MapView
          context="state"
          state={props.loaderData.state}
          districts={props.loaderData.districts}
        />
      )}
    </ClientOnly>
  );
}
