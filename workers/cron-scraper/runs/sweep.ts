import type { DrizzleD1Database } from "drizzle-orm/d1";
import { listings, priceHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RunTracker } from "../run-tracker";
import { fetchOverview, parseOverview } from "../sources/willhaben/overview";

function computeSweepStartPage(
  lastRun: { startedAt: Date | null; lastOverviewPage: number | null } | null,
  now: Date
): number {
  if (!lastRun || !lastRun.startedAt) return 1;
  const twelveHoursMs = 12 * 60 * 60 * 1000;
  if (now.getTime() - new Date(lastRun.startedAt).getTime() > twelveHoursMs) {
    return 1;
  }
  const lastPage = lastRun.lastOverviewPage ?? 1;
  return Math.max(1, lastPage - 5);
}

export async function runSweep(
  db: DrizzleD1Database<typeof import("@/db/schema")>
): Promise<void> {
  const tracker = new RunTracker(db);
  const started = await tracker.startRun("sweep");
  console.log(`[sweep] start`);
  const metrics: {
    overviewPagesVisited: number;
    detailPagesFetched: number;
    listingsUpdated: number;
    priceHistoryInserted: number;
    priceChangesDetected: number;
  } = {
    overviewPagesVisited: 0,
    detailPagesFetched: 0,
    listingsUpdated: 0,
    priceHistoryInserted: 0,
    priceChangesDetected: 0,
  };

  try {
    const rowsPerPage = 90;
    const maxPages = 250;
    const lastRun = await tracker.getLastRunOfType("sweep");
    let page = computeSweepStartPage(lastRun, new Date());
    console.log(
      `[sweep] computed start page=${page} lastRunPage=${
        lastRun?.lastOverviewPage ?? "n/a"
      }`
    );

    while (page <= maxPages) {
      const html = await fetchOverview(page, rowsPerPage);
      const items = parseOverview(html);
      metrics.overviewPagesVisited++;
      console.log(`[sweep] page=${page} items=${items.length}`);
      if (items.length === 0) break;

      for (const item of items) {
        const now = new Date();
        const row = await db
          .select({ id: listings.id, price: listings.price })
          .from(listings)
          .where(eq(listings.platformListingId, item.id))
          .get();

        if (!row?.id) {
          // Sweep does not create new listings; skip unknown entries
          continue;
        }

        const hasPrice =
          typeof item.price === "number" && Number.isFinite(item.price);
        const isChange =
          hasPrice && typeof row.price === "number" && row.price !== item.price;
        if (hasPrice) {
          await db
            .update(listings)
            .set({
              lastSeenAt: now,
              lastScrapedAt: now,
              price: hasPrice ? item.price : 0,
              isActive: true,
            })
            .where(eq(listings.id, row.id))
            .run();

          await db
            .insert(priceHistory)
            .values({
              listingId: row.id,
              price: item.price ?? 0,
              observedAt: now,
            })
            .run();
          metrics.priceHistoryInserted++;
          if (isChange) metrics.priceChangesDetected++;

          metrics.listingsUpdated++;
        }
      }

      await tracker.updateRun(started.id, {
        ...metrics,
        lastOverviewPage: page,
      });
      console.log(
        `[sweep] progress: pages=${metrics.overviewPagesVisited} priceRows=${metrics.priceHistoryInserted} priceChanges=${metrics.priceChangesDetected} updated=${metrics.listingsUpdated}`
      );

      page++;
    }

    await tracker.finishRun(started.id, started.startedAt, "success");
    console.log(`[sweep] done: status=success`);
  } catch (error) {
    await tracker.finishRun(
      started.id,
      started.startedAt,
      "error",
      error instanceof Error ? error.message : String(error)
    );
    console.log(`[sweep] done: status=error`);
  }
}
