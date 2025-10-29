import { z } from "zod";

export const mapMetricSchema = z
  .enum(["limitedPercentage", "avgPricePerSqm", "totalListings"])
  .default("limitedPercentage");

export type MapMetric = z.infer<typeof mapMetricSchema>;

export const sortBySchema = z
  .enum(["price", "area", "pricePerSqm", "lastSeenAt"])
  .default("lastSeenAt");

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export const regionParamsSchema = z.object({
  state: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
});

export const listingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(24),
  sortBy: sortBySchema,
  order: sortOrderSchema,
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  limited: z.coerce.boolean().optional(),
  unlimited: z.coerce.boolean().optional(),
  rooms: z.coerce.number().int().optional(),
  platforms: z.array(z.string()).default([]),
});

export type ListingsQuery = z.infer<typeof listingsQuerySchema>;

export const mapQuerySchema = z.object({
  metric: mapMetricSchema,
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  limited: z.coerce.boolean().optional(),
  unlimited: z.coerce.boolean().optional(),
  platforms: z.array(z.string()).default([]),
});

export type MapQuery = z.infer<typeof mapQuerySchema>;

function splitCommaList(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return parts.length ? parts : undefined;
}

export function parseRegionParams(params: {
  state?: string;
  district?: string;
}) {
  return regionParamsSchema.parse(params);
}

export function parseListingsQuery(
  searchParams: URLSearchParams
): ListingsQuery {
  const platformsList = splitCommaList(searchParams.get("platforms"));
  const base = Object.fromEntries(searchParams);
  return listingsQuerySchema.parse({
    ...base,
    platforms: platformsList ?? [],
  });
}

export function parseMapQuery(searchParams: URLSearchParams): MapQuery {
  const base = Object.fromEntries(searchParams);
  const platformsList = splitCommaList(searchParams.get("platforms"));
  return mapQuerySchema.parse({ ...base, platforms: platformsList ?? [] });
}
