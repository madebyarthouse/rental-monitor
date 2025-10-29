import type { Route } from "./+types/_app._index";
import { RegionService } from "@/services/region-service";
import type { DistrictWithStateDTO } from "@/services/region-service";
import { MapService } from "@/services/map-service";
import { StatisticsService } from "@/services/statistics-service";
import { parseMapQuery } from "@/lib/params";
import MapView from "@/components/features/map/map-view.client";
import { ClientOnly } from "@/components/client-only";
import { MapCharts } from "@/components/features/charts/map-charts";

type BoundsTuple = [[number, number], [number, number]];
type RegionDTO = {
  id: number;
  name: string;
  slug: string;
  geojson?: unknown;
  bounds?: BoundsTuple;
};

export async function loader({ context, request }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const mapService = new MapService(context.cloudflare.env.rental_monitor);
  const statisticsService = new StatisticsService(
    context.cloudflare.env.rental_monitor
  );
  const [country, districts] = await Promise.all([
    regionService.getCountry(),
    regionService.getAllDistrictsWithStateSlug(),
  ]);
  if (!country) throw new Response("Not Found", { status: 404 });
  const url = new URL(request.url);
  const query = parseMapQuery(url.searchParams);
  const heatmap = await mapService.getHeatmapData(
    { level: "country" },
    query.metric,
    {
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minArea: query.minArea,
      maxArea: query.maxArea,
      limited: query.limited,
      unlimited: query.unlimited,
      platforms: query.platforms,
    }
  );
  const [stats, limitedCounts, priceHistogram] = await Promise.all([
    statisticsService.getStatistics(
      { level: "country" },
      {
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        minArea: query.minArea,
        maxArea: query.maxArea,
        limited: query.limited,
        unlimited: query.unlimited,
        platforms: query.platforms,
      }
    ),
    statisticsService.getLimitedCounts(
      { level: "country" },
      {
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        minArea: query.minArea,
        maxArea: query.maxArea,
        limited: query.limited,
        unlimited: query.unlimited,
        platforms: query.platforms,
      }
    ),
    statisticsService.getPriceHistogram(
      { level: "country" },
      {
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        minArea: query.minArea,
        maxArea: query.maxArea,
        limited: query.limited,
        unlimited: query.unlimited,
        platforms: query.platforms,
      }
    ),
  ]);
  return {
    country: { name: country.name, slug: country.slug, bounds: country.bounds },
    districts: districts.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      stateSlug: d.stateSlug,
      geojson: d.geojson,
    })),
    heatmap,
    stats,
    limitedCounts,
    priceHistogram,
  };
}

export default function RootMap(props: Route.ComponentProps) {
  return (
    <div className="py-4 px-4 flex flex-col gap-10">
      <ClientOnly>
        {() => (
          <MapView
            context="country"
            country={props.loaderData.country}
            districts={props.loaderData.districts}
            heatmap={props.loaderData.heatmap}
          />
        )}
      </ClientOnly>
      <MapCharts
        priceHistogram={props.loaderData.priceHistogram}
        limitedCounts={props.loaderData.limitedCounts}
      />
    </div>
  );
}
