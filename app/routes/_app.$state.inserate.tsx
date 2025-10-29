import type { Route } from "./+types/_app.$state.inserate";
import { RegionService } from "@/services/region-service";
import { ListingsService } from "@/services/listings-service";
import { parseListingsQuery } from "@/lib/params";
import { ListingsPage } from "@/components/features/listings/listings-page";
import { StatisticsService } from "@/services/statistics-service";

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
  const listings = await listingsService.getListings(
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
  );
  return {
    level: "state" as const,
    state: stateData.state,
    districts: stateData.districts,
    listings,
    // stats for summary bar in layout
    stats: await statisticsService.getStatistics(
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
  };
}

export default function StateListingsView({
  loaderData,
}: Route.ComponentProps) {
  return <ListingsPage data={loaderData.listings} />;
}
