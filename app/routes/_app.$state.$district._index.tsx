import type { Route } from "./+types/_app.$state.$district._index";
import { RegionService } from "@/services/region-service";
import MapView from "@/components/features/map/map-view.client";
import { ClientOnly } from "@/components/client-only";
import { MapService } from "@/services/map-service";
import { StatisticsService } from "@/services/statistics-service";
import { parseMapQuery } from "@/lib/params";
import { MapCharts } from "@/components/features/charts/map-charts";
import { StatsSummary } from "@/components/features/layout/stats-summary";
import {
  buildTitle,
  buildDescription,
  canonicalFrom,
  hasFilterParams,
} from "@/lib/seo";

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
  const districtIds = stateData.districts.map((d) => d.id);
  // Fetch heatmap for entire state, not just active district
  const heatmap = await mapService.getHeatmapData(
    { level: "state", districtIds },
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
    districtIds
  );
  const [stats, limitedCounts, priceHistogram, groupedStats] =
    await Promise.all([
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
      // Fetch grouped stats for all districts in state for popup data
      statisticsService.getGroupedStatistics(
        { level: "state", districtIds },
        {
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          minArea: query.minArea,
          maxArea: query.maxArea,
          limited: query.limited,
          unlimited: query.unlimited,
          platforms: query.platforms,
        },
        "district"
      ),
    ]);

  const urlObj = new URL(request.url);
  const canonical = canonicalFrom(urlObj);
  const hasFilters = hasFilterParams(urlObj.searchParams);

  return {
    state: {
      name: stateData.state.name,
      slug: stateData.state.slug,
      bounds: stateData.state.bounds,
      centerLat: stateData.state.centerLat,
      centerLng: stateData.state.centerLng,
    },
    districts: stateData.districts.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      geojson: d.geojson,
      stateSlug: stateData.state.slug,
      stateName: stateData.state.name,
    })),
    activeDistrictSlug: activeDistrict.slug,
    heatmap,
    stats,
    limitedCounts,
    priceHistogram,
    groupedStats,
    districtName: activeDistrict.name,
    canonical,
    hasFilters,
  };
}

export default function DistrictMapView(props: Route.ComponentProps) {
  const districtName = props.loaderData.districtName as string | undefined;
  const stateName = props.loaderData.state?.name as string | undefined;
  const title = buildTitle([districtName ?? "", stateName ?? ""]);
  const description = buildDescription({
    scope: "district",
    name: `${districtName ?? ""}, ${stateName ?? ""}`,
  });
  const canonical = props.loaderData.canonical as string | undefined;
  const robots = props.loaderData.hasFilters
    ? "noindex,follow"
    : "index,follow";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta name="robots" content={robots} />
      <div className="flex flex-col gap-10 min-h-[350px] md:min-h-[500px]">
        <ClientOnly>
          {() => (
            <div className="px-8 py-8">
              <MapView
                context="district"
                state={props.loaderData.state}
                districts={props.loaderData.districts}
                activeDistrictSlug={props.loaderData.activeDistrictSlug}
                heatmap={props.loaderData.heatmap}
                districtStats={
                  new Map(
                    props.loaderData.groupedStats.map((g) => [g.slug, g.stats])
                  )
                }
              />
            </div>
          )}
        </ClientOnly>
        <StatsSummary />
        <MapCharts
          priceHistogram={props.loaderData.priceHistogram}
          limitedCounts={props.loaderData.limitedCounts}
          groupedStats={props.loaderData.groupedStats}
          groupLevel="district"
          activeSlug={props.loaderData.activeDistrictSlug}
        />
      </div>
    </>
  );
}
