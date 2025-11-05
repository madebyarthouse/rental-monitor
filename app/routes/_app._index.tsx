import type { Route } from "./+types/_app._index";
import { RegionService } from "@/services/region-service";
import type { DistrictWithStateDTO } from "@/services/region-service";
import { MapService } from "@/services/map-service";
import { StatisticsService } from "@/services/statistics-service";
import { parseMapQuery } from "@/lib/params";
import MapView from "@/components/features/map/map-view.client";
import { ClientOnly } from "@/components/client-only";
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

export async function loader({ context, request }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const mapService = new MapService(context.cloudflare.env.rental_monitor);
  const statisticsService = new StatisticsService(
    context.cloudflare.env.rental_monitor
  );
  const [country, districts, states] = await Promise.all([
    regionService.getCountry(),
    regionService.getAllDistrictsWithStateSlug(),
    regionService.getAllStates(),
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
  const [stats, limitedCounts, priceHistogram, groupedStats, districtStats] =
    await Promise.all([
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
      statisticsService.getGroupedStatistics(
        { level: "country" },
        {
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          minArea: query.minArea,
          maxArea: query.maxArea,
          limited: query.limited,
          unlimited: query.unlimited,
          platforms: query.platforms,
        },
        "state"
      ),
      statisticsService.getGroupedStatistics(
        { level: "country" },
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
  const canonical = canonicalFrom(url);
  const hasFilters = hasFilterParams(url.searchParams);

  return {
    country: { name: country.name, slug: country.slug, bounds: country.bounds },
    districts: districts.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      stateSlug: d.stateSlug,
      stateName: d.stateName,
      geojson: d.geojson,
    })),
    states: states.map((s) => ({ name: s.name, slug: s.slug })),
    heatmap,
    stats,
    limitedCounts,
    priceHistogram,
    groupedStats,
    districtStats,
    canonical,
    hasFilters,
  };
}

export default function RootMap(props: Route.ComponentProps) {
  const title = buildTitle(["Österreich"]);
  const description = buildDescription({ scope: "country" });
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
      <div className="flex flex-col gap-10">
        <div className="px-4 pt-8 pb-8 min-h-[350px] md:min-h-[500px]">
          <ClientOnly>
            {() => (
              <MapView
                context="country"
                country={props.loaderData.country}
                districts={props.loaderData.districts}
                states={props.loaderData.states}
                heatmap={props.loaderData.heatmap}
                districtStats={
                  new Map(
                    props.loaderData.districtStats.map((g) => [g.slug, g.stats])
                  )
                }
              />
            )}
          </ClientOnly>
        </div>
        <StatsSummary />
        <MapCharts
          priceHistogram={props.loaderData.priceHistogram}
          limitedCounts={props.loaderData.limitedCounts}
          groupedStats={props.loaderData.groupedStats}
          groupLevel="state"
        />
      </div>
    </>
  );
}
