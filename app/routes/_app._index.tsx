import type { Route } from "./+types/_app._index";
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

export async function loader({ context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const [country, districts] = await Promise.all([
    regionService.getCountry(),
    regionService.getAllDistricts(),
  ]);
  if (!country) throw new Response("Not Found", { status: 404 });
  return {
    country: { name: country.name, slug: country.slug, bounds: country.bounds },
    districts: districts.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      geojson: d.geojson,
    })),
  };
}

export default function RootMap(props: Route.ComponentProps) {
  return (
    <ClientOnly>
      {() => (
        <MapView
          context="country"
          country={props.loaderData.country}
          districts={props.loaderData.districts}
        />
      )}
    </ClientOnly>
  );
}
