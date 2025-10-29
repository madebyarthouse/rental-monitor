import type { Route } from "./+types/_app.inserate";
import { RegionService } from "@/services/region-service";
import { ListingsService } from "@/services/listings-service";
import { parseListingsQuery } from "@/lib/params";
import { ListingList } from "@/components/features/listings/listing-list";
import { StatisticsService } from "@/services/statistics-service";
import { ListingsToolbar } from "../components/features/listings/listings-toolbar";

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
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Inserate</h1>
        <p className="text-sm text-muted-foreground">Österreichweite Ansicht</p>
      </div>
      <ListingsToolbar />
      <ListingList data={loaderData.listings} />
    </div>
  );
}
