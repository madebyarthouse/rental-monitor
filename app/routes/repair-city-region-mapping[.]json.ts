import type { Route } from "./+types/repair-city-region-mapping[.]json";
import { dbClient } from "@/db/client";
import { listings, regions } from "@/db/schema";
import { and, eq, isNull, or, sql } from "drizzle-orm";

export async function loader({ context, request }: Route.LoaderArgs) {
  const db = dbClient(context.cloudflare.env.rental_monitor);
  const url = new URL(request.url);
  const apply = ["1", "true", "yes"].includes(
    (url.searchParams.get("apply") ?? "").toLowerCase()
  );

  // Direct willhaben → internal slug mapping (1:1, no normalization)
  const WILLHABEN_TO_INTERNAL: Record<string, string> = {
    wels: "stadt-wels",
    linz: "stadt-linz",
    steyr: "stadt-steyr",
    "sankt pölten": "sankt-polten-stadt",
    "wiener neustadt": "wiener-neustadt-stadt",
    rust: "rust-stadt",
  };

  // Include both human-readable names and slug-like variants (e.g., "sankt pölten" and "sankt-poelten")
  function toSlugKey(input: string): string {
    let s = input.toLowerCase();
    s = s
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss");
    s = s.replace(/[^a-z0-9]+/g, "-");
    s = s.replace(/^-+|-+$/g, "");
    return s;
  }
  const variantToInternal: Record<string, string> = {};
  for (const [key, slug] of Object.entries(WILLHABEN_TO_INTERNAL)) {
    variantToInternal[key] = slug;
    variantToInternal[toSlugKey(key)] = slug;
  }

  // Preload only needed regions and build slug → id map
  const allRegions = await db
    .select({
      id: regions.id,
      name: regions.name,
      slug: regions.slug,
      type: regions.type,
      parentId: regions.parentId,
    })
    .from(regions)
    .all();
  const slugToRegionId = new Map<string, number>();
  for (const r of allRegions) slugToRegionId.set(r.slug, r.id);

  // Case-insensitive LIKE patterns for candidate selection
  const likeKeys = Object.keys(variantToInternal);
  const likeExprs = likeKeys.map(
    (k) => sql`lower(${listings.district}) like ${"%" + k + "%"}`
  );
  const likeAny = sql`${sql.join(likeExprs, sql` OR `)}`;

  const candidates = await db
    .select({
      id: listings.id,
      platform: listings.platform,
      regionId: listings.regionId,
      state: listings.state,
      district: listings.district,
      city: listings.city,
    })
    .from(listings)
    .where(
      and(
        eq(listings.platform, "willhaben"),
        or(isNull(listings.regionId), likeAny as any)
      )
    )
    .all();

  type UpdatePlan = {
    id: number;
    currentRegionId: number | null;
    targetRegionId: number;
  };
  const updates: UpdatePlan[] = [];
  const perTarget = new Map<
    number,
    { slug: string; regionId: number; ids: number[] }
  >();

  for (const row of candidates) {
    const dLower = (row.district ?? "").toLowerCase();
    const matchedKey = likeKeys.find((k) => dLower.includes(k));
    if (!matchedKey) continue;
    const targetSlug = variantToInternal[matchedKey];
    const targetId = slugToRegionId.get(targetSlug);
    if (!targetId) continue;
    if (row.regionId !== targetId) {
      updates.push({
        id: row.id,
        currentRegionId: row.regionId,
        targetRegionId: targetId,
      });
      const bucket = perTarget.get(targetId) ?? {
        slug: targetSlug,
        regionId: targetId,
        ids: [],
      };
      bucket.ids.push(row.id);
      perTarget.set(targetId, bucket);
    }
  }

  if (!apply) {
    const summary = {
      apply: false as const,
      totalConsidered: candidates.length,
      totalNeedingUpdate: updates.length,
      perTarget: Array.from(perTarget.values()).map((x) => ({
        slug: x.slug,
        regionId: x.regionId,
        updateCount: x.ids.length,
        sampleIds: x.ids.slice(0, 20),
      })),
    };
    return new Response(JSON.stringify(summary), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  if (updates.length > 0) {
    const stmts = updates.map((u) =>
      db
        .update(listings)
        .set({ regionId: u.targetRegionId })
        .where(eq(listings.id, u.id))
    );
    // @ts-expect-error batch types
    await db.batch(stmts);
  }

  const result = {
    apply: true as const,
    updatedTotal: updates.length,
    perTarget: Array.from(perTarget.values()).map((x) => ({
      slug: x.slug,
      regionId: x.regionId,
      updateCount: x.ids.length,
    })),
  };
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
