import type { Route } from "./+types/_app.$state.$district._index";
import { RegionService } from "@/services/region-service";
import MapView from "@/components/features/map/map-view.client";
import { ClientOnly } from "@/components/client-only";
import { MapService } from "@/services/map-service";
import { StatisticsService } from "@/services/statistics-service";
import { parseMapQuery } from "@/lib/params";
import { MapCharts } from "@/components/features/charts/map-charts";

type BoundsTuple = [[number, number], [number, number]];
type RegionDTO = {
  id: number;
  name: string;
  slug: string;
  geojson?: unknown;
  bounds?: BoundsTuple;
};

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const mapService = new MapService(context.cloudflare.env.rental_monitor);
  const statisticsService = new StatisticsService(
    context.cloudflare.env.rental_monitor
  );
  const { state: stateSlug, district: districtSlug } = params;

  const stateData = await regionService.getStateWithDistricts(stateSlug);
  if (!stateData) throw new Response("Not Found", { status: 404 });

  const activeDistrict = stateData.districts.find(
    (d) => d.slug === districtSlug
  );
  if (!activeDistrict) throw new Response("Not Found", { status: 404 });

  const url = new URL(request.url);
  const query = parseMapQuery(url.searchParams);
  const heatmap = await mapService.getHeatmapData(
    { level: "district", districtId: activeDistrict.id },
    query.metric,
    {
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minArea: query.minArea,
      maxArea: query.maxArea,
      limited: query.limited,
      unlimited: query.unlimited,
      platforms: query.platforms,
    },
    [activeDistrict.id]
  );
  const [stats, limitedCounts, priceHistogram] = await Promise.all([
    statisticsService.getStatistics(
      { level: "district", districtId: activeDistrict.id },
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
      { level: "district", districtId: activeDistrict.id },
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
      { level: "district", districtId: activeDistrict.id },
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
    activeDistrictSlug: activeDistrict.slug,
    heatmap,
    stats,
    limitedCounts,
    priceHistogram,
  };
}

export default function DistrictMapView(props: Route.ComponentProps) {
  return (
    <>
      <ClientOnly>
        {() => (
          <MapView
            context="district"
            state={props.loaderData.state}
            districts={props.loaderData.districts}
            activeDistrictSlug={props.loaderData.activeDistrictSlug}
            heatmap={props.loaderData.heatmap}
          />
        )}
      </ClientOnly>
      <MapCharts
        className="p-4 md:p-6 lg:p-8"
        priceHistogram={props.loaderData.priceHistogram}
        limitedCounts={props.loaderData.limitedCounts}
      />
    </>
  );
}
