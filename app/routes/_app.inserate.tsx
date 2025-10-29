import type { Route } from "./+types/_app.inserate";
import { RegionService } from "@/services/region-service";
import { ListingsService } from "@/services/listings-service";
import { parseListingsQuery } from "@/lib/params";
import { ListingsPage } from "@/components/features/listings/listings-page";
import { StatisticsService } from "@/services/statistics-service";

export async function loader({ context, request }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const listingsService = new ListingsService(
    context.cloudflare.env.rental_monitor
  );
  const statisticsService = new StatisticsService(
    context.cloudflare.env.rental_monitor
  );
  const url = new URL(request.url);
  const query = parseListingsQuery(url.searchParams);
  // Austria level: fetch all states
  const states = await regionService.getAllStates();
  const listings = await listingsService.getListings(
    { level: "country" },
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
    { level: "country" },
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
    level: "country" as const,
    regions: states,
    listings,
    stats,
  };
}

export default function ListingsView({ loaderData }: Route.ComponentProps) {
  return <ListingsPage data={loaderData.listings} />;
}
