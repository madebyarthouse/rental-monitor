import type { Route } from "./+types/_app.$state.inserate";
import { RegionService } from "@/services/region-service";
import { ListingsService } from "@/services/listings-service";
import { parseListingsQuery } from "@/lib/params";
import { ListingsPage } from "@/components/features/listings/listings-page";
import { StatisticsService } from "@/services/statistics-service";
import {
  buildTitle,
  buildDescription,
  canonicalFrom,
  hasFilterParams,
} from "@/lib/seo";

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const listingsService = new ListingsService(
    context.cloudflare.env.rental_monitor
  );
  const statisticsService = new StatisticsService(
    context.cloudflare.env.rental_monitor
  );
  const { state: stateSlug } = params;
  const url = new URL(request.url);
  const query = parseListingsQuery(url.searchParams);

  const stateData = await regionService.getStateWithDistricts(stateSlug);
  if (!stateData) throw new Response("Not Found", { status: 404 });

  // State level: return state + districts
  const [listings, stats] = await Promise.all([
    listingsService.getListings(
      {
        level: "state",
        districtIds: stateData.districts.map((d) => d.id),
        districtNames: stateData.districts.map((d) => d.name),
        stateName: stateData.state.name,
      },
      {
        page: query.page,
        perPage: query.perPage,
        sortBy: query.sortBy,
        order: query.order,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        minArea: query.minArea,
        maxArea: query.maxArea,
        limited: query.limited,
        unlimited: query.unlimited,
        rooms: query.rooms,
        platforms: query.platforms,
      }
    ),
    statisticsService.getStatistics(
      { level: "state", districtIds: stateData.districts.map((d) => d.id) },
      {
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        minArea: query.minArea,
        maxArea: query.maxArea,
        limited: query.limited,
        unlimited: query.unlimited,
        rooms: query.rooms,
        platforms: query.platforms,
      }
    ),
  ]);
  const urlObj = new URL(request.url);
  const canonical = canonicalFrom(urlObj);
  const hasFilters = hasFilterParams(urlObj.searchParams);

  return {
    level: "state" as const,
    state: stateData.state,
    districts: stateData.districts,
    listings,
    stats,
    canonical,
    hasFilters,
  };
}

export default function StateListingsView({
  loaderData,
}: Route.ComponentProps) {
  const stateName = loaderData.state?.name as string | undefined;
  const title = buildTitle(["Inserate", stateName ?? ""]);
  const description = buildDescription({ scope: "listings" });
  const canonical = loaderData.canonical as string | undefined;
  const robots = loaderData.hasFilters ? "noindex,follow" : "index,follow";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta name="robots" content={robots} />
      <ListingsPage data={loaderData.listings} />
    </>
  );
}
