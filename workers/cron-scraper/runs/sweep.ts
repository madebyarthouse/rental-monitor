import type { DrizzleD1Database } from "drizzle-orm/d1";
import { listings, priceHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RunTracker } from "../run-tracker";
import { fetchOverview, parseOverview } from "../sources/willhaben/overview";
import { fetchDetail, parseDetail } from "../sources/willhaben/detail";

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
  const metrics: {
    overviewPagesVisited: number;
    detailPagesFetched: number;
    listingsUpdated: number;
    priceHistoryInserted: number;
  } = {
    overviewPagesVisited: 0,
    detailPagesFetched: 0,
    listingsUpdated: 0,
    priceHistoryInserted: 0,
  };

  try {
    const rowsPerPage = 60;
    const maxPages = 50;
    const lastRun = await tracker.getLastRunOfType("sweep");
    let page = computeSweepStartPage(lastRun, new Date());

    while (page <= maxPages) {
      const html = await fetchOverview(page, rowsPerPage);
      const items = parseOverview(html);
      metrics.overviewPagesVisited++;
      if (items.length === 0) break;

      for (const item of items) {
        const now = new Date();
        const detailHtml = await fetchDetail(item.url);
        const detail = parseDetail(detailHtml);
        if (!detail) continue;
        metrics.detailPagesFetched++;

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
            },
          })
          .run();

        const row = await db
          .select({ id: listings.id })
          .from(listings)
          .where(eq(listings.url, detail.url))
          .get();
        if (row?.id) {
          await db
            .insert(priceHistory)
            .values({ listingId: row.id, price: detail.price, observedAt: now })
            .run();
          metrics.priceHistoryInserted++;
        }

        metrics.listingsUpdated++;
      }

      await tracker.updateRun(started.id, {
        ...metrics,
        lastOverviewPage: page,
      });
      page++;
    }

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
