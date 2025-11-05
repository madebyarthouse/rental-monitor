import type { Route } from "./+types/_app.inserate";
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

  const canonical = canonicalFrom(url);
  const hasFilters = hasFilterParams(url.searchParams);

  return {
    level: "country" as const,
    regions: states,
    listings,
    stats,
    canonical,
    hasFilters,
  };
}

export default function ListingsView({ loaderData }: Route.ComponentProps) {
  const title = buildTitle(["Inserate"]);
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
