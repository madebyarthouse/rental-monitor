import type { DrizzleD1Database } from "drizzle-orm/d1";
import { listings, priceHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RunTracker } from "../run-tracker";
import { fetchOverview, parseOverview } from "../sources/willhaben/overview";
import { fetchDetail, parseDetail } from "../sources/willhaben/detail";

export async function runDiscovery(
  db: DrizzleD1Database<typeof import("@/db/schema")>
): Promise<void> {
  const tracker = new RunTracker(db);
  const started = await tracker.startRun("discovery");
  const metrics = {
    overviewPagesVisited: 0,
    detailPagesFetched: 0,
    listingsDiscovered: 0,
    listingsUpdated: 0,
    priceHistoryInserted: 0,
  };

  try {
    const rowsPerPage = 60;
    let page = 1;
    let newFoundOnPage = 0;
    const maxPages = 20; // safety cap

    do {
      const html = await fetchOverview(page, rowsPerPage);
      const items = parseOverview(html);
      metrics.overviewPagesVisited++;
      if (items.length === 0) break;

      newFoundOnPage = 0;
      for (const item of items) {
        const existing = await db
          .select({ id: listings.id })
          .from(listings)
          .where(eq(listings.url, item.url))
          .get();

        if (!existing) {
          const detailHtml = await fetchDetail(item.url);
          const detail = parseDetail(detailHtml);
          if (!detail) continue;
          metrics.detailPagesFetched++;
          const now = new Date();
          await db
            .insert(listings)
            .values({
              platformListingId: detail.id,
              title: detail.title,
              price: detail.price,
              area: detail.area || null,
              zipCode: detail.location?.zipCode || null,
              city: detail.location?.city || null,
              district: detail.location?.district || null,
              state: detail.location?.state || null,
              isLimited: !!detail.duration?.isLimited,
              durationMonths: detail.duration?.months || null,
              platform: detail.platform,
              url: detail.url,
              externalId: detail.id,
              firstSeenAt: now,
              lastSeenAt: now,
              lastScrapedAt: now,
              isActive: true,
              verificationStatus: "active",
            })
            .onConflictDoUpdate({
              target: listings.url,
              set: {
                title: detail.title,
                price: detail.price,
                area: detail.area || null,
                zipCode: detail.location?.zipCode || null,
                city: detail.location?.city || null,
                district: detail.location?.district || null,
                state: detail.location?.state || null,
                isLimited: !!detail.duration?.isLimited,
                durationMonths: detail.duration?.months || null,
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
            .where(eq(listings.url, detail.url))
            .get();
          if (row?.id) {
            await db
              .insert(priceHistory)
              .values({
                listingId: row.id,
                price: detail.price,
                observedAt: now,
              })
              .run();
            metrics.priceHistoryInserted++;
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
      page++;
    } while (newFoundOnPage > 0 && page <= maxPages);

    await tracker.finishRun(started.id, started.startedAt, "success");
  } catch (error) {
    await tracker.finishRun(
      started.id,
      started.startedAt,
      "error",
      error instanceof Error ? error.message : String(error)
    );
  }
}
