import type { DrizzleD1Database } from "drizzle-orm/d1";
import { listings, priceHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RunTracker } from "../run-tracker";
import { fetchOverview, parseOverview } from "../sources/willhaben/overview";
import { fetchDetail, parseDetail } from "../sources/willhaben/detail";
import { upsertSeller } from "../utils/seller";

export async function runDiscovery(
  db: DrizzleD1Database<typeof import("@/db/schema")>
): Promise<void> {
  const tracker = new RunTracker(db);
  const started = await tracker.startRun("discovery");
  console.log(`[discovery] start`);
  const metrics = {
    overviewPagesVisited: 0,
    detailPagesFetched: 0,
    listingsDiscovered: 0,
    listingsUpdated: 0,
    priceHistoryInserted: 0,
  };

  try {
    const rowsPerPage = 90;
    let page = 1;
    let newFoundOnPage = 0;
    let consecutiveNoNew = 0;
    const maxPages = 10; // safety cap

    while (page <= maxPages && consecutiveNoNew < 3) {
      const html = await fetchOverview(page, rowsPerPage);
      const items = parseOverview(html);
      console.log(`[discovery] page=${page} items=${items.length}`);
      metrics.overviewPagesVisited++;
      if (items.length === 0) break;

      newFoundOnPage = 0;
      for (const item of items) {
        const existing = await db
          .select({ id: listings.id })
          .from(listings)
          .where(eq(listings.platformListingId, item.id))
          .get();

        if (!existing) {
          const now = new Date();

          // Minimal seller upsert if available from overview
          const minimalSellerId = item.platformSellerId
            ? await upsertSeller(db, "willhaben", {
                platformSellerId: item.platformSellerId,
              })
            : null;

          await db
            .insert(listings)
            .values({
              platformListingId: item.id,
              title: item.title,
              price: item.price ?? 0,
              area: item.area ?? null,
              rooms: item.rooms ?? null,
              zipCode: item.zipCode ?? null,
              city: item.city ?? null,
              district: item.district ?? null,
              state: item.state ?? null,
              latitude: item.latitude ?? null,
              longitude: item.longitude ?? null,
              // Duration populated after detail fetch
              isLimited: false,
              durationMonths: null,
              platform: "willhaben",
              url: item.url,
              externalId: item.id,
              sellerId: minimalSellerId ?? null,
              firstSeenAt: now,
              lastSeenAt: now,
              lastScrapedAt: now,
              isActive: true,
              verificationStatus: "active",
            })
            .onConflictDoUpdate({
              target: listings.url,
              set: {
                title: item.title,
                price: item.price ?? 0,
                area: item.area ?? null,
                rooms: item.rooms ?? null,
                zipCode: item.zipCode ?? null,
                city: item.city ?? null,
                district: item.district ?? null,
                state: item.state ?? null,
                latitude: item.latitude ?? null,
                longitude: item.longitude ?? null,
                lastSeenAt: now,
                lastScrapedAt: now,
                isActive: true,
                verificationStatus: "active",
              },
            })
            .run();

          // Fetch listing id to insert price history
          const row = await db
            .select({ id: listings.id })
            .from(listings)
            .where(eq(listings.platformListingId, item.id))
            .get();
          if (row?.id) {
            await db
              .insert(priceHistory)
              .values({
                listingId: row.id,
                price: item.price ?? 0,
                observedAt: now,
              })
              .run();
            metrics.priceHistoryInserted++;
          }

          // Fetch details only to enrich duration and seller info
          const detailHtml = await fetchDetail(item.url);
          const detail = parseDetail(detailHtml);
          if (detail) {
            metrics.detailPagesFetched++;
            const enrichedSellerId = await upsertSeller(
              db,
              "willhaben",
              detail.seller
            );
            await db
              .update(listings)
              .set({
                isLimited: !!detail.duration?.isLimited,
                durationMonths: detail.duration?.months ?? null,
                sellerId: enrichedSellerId ?? minimalSellerId ?? null,
                lastScrapedAt: now,
              })
              .where(eq(listings.platformListingId, item.id))
              .run();
          }

          metrics.listingsDiscovered++;
          newFoundOnPage++;
        } else {
          // Touch lastSeenAt for existing, but discovery focuses on new
          const now = new Date();
          await db
            .update(listings)
            .set({ lastSeenAt: now })
            .where(eq(listings.id, existing.id))
            .run();
          metrics.listingsUpdated++;
        }
      }

      await tracker.updateRun(started.id, metrics);
      console.log(
        `[discovery] progress: pages=${metrics.overviewPagesVisited} new=${metrics.listingsDiscovered} updated=${metrics.listingsUpdated} details=${metrics.detailPagesFetched}`
      );
      if (newFoundOnPage === 0) {
        consecutiveNoNew++;
      } else {
        consecutiveNoNew = 0;
      }
      page++;
    }

    await tracker.finishRun(started.id, started.startedAt, "success");
    console.log(`[discovery] done: status=success`);
  } catch (error) {
    await tracker.finishRun(
      started.id,
      started.startedAt,
      "error",
      error instanceof Error ? error.message : String(error)
    );
    console.log(`[discovery] done: status=error`);
  }
}
