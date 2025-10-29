import type { Route } from "./+types/_app.$state.$district.inserate";
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
  const { state: stateSlug, district: districtSlug } = params;
  const url = new URL(request.url);
  const query = parseListingsQuery(url.searchParams);

  const stateData = await regionService.getStateWithDistricts(stateSlug);
  if (!stateData) throw new Response("Not Found", { status: 404 });

  // District level: return state bounds + district
  const district = stateData.districts.find((d) => d.slug === districtSlug);
  if (!district) throw new Response("Not Found", { status: 404 });

  const listings = await listingsService.getListings(
    { level: "district", districtId: district.id, districtName: district.name },
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
  const stats = await statisticsService.getStatistics(
    { level: "district", districtId: district.id },
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
  );

  return {
    level: "district" as const,
    state: stateData.state,
    district,
    districts: stateData.districts,
    listings,
    stats,
  };
}

export default function DistrictListingsView({
  loaderData,
}: Route.ComponentProps) {
  return <ListingsPage data={loaderData.listings} />;
}
