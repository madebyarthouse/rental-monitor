import type { DrizzleD1Database } from "drizzle-orm/d1";
import { listings, priceHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RunTracker } from "../run-tracker";
import { fetchOverview, parseOverview } from "../sources/willhaben/overview";

// Retry wrapper with structured logs for transient D1/SQLite lock/busy errors
async function runWithRetry<T>(
  opName: string,
  ctx: Record<string, unknown> | undefined,
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 100
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const shouldRetry =
        /locked|SQLITE_BUSY|SQLITE_LOCKED|busy|code\s*5|code\s*6|code\s*49/i.test(
          message
        );
      console.log(
        `[retry] op=${opName} attempt=${
          attempt + 1
        }/${attempts} willRetry=${shouldRetry} error=${message}${
          ctx ? ` ctx=${JSON.stringify(ctx)}` : ""
        }`
      );
      if (!shouldRetry) throw error;
      const delay = baseDelayMs * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  console.log(
    `[retry] op=${opName} exhausted attempts=${attempts}${
      ctx ? ` ctx=${JSON.stringify(ctx)}` : ""
    }`
  );
  throw lastError;
}

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
    const maxPages = 50;
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
          await runWithRetry(
            "listings.update",
            { id: row.id, price: item.price ?? null },
            () =>
              db
                .update(listings)
                .set({
                  lastSeenAt: now,
                  lastScrapedAt: now,
                  price: hasPrice ? item.price : 0,
                  isActive: true,
                })
                .where(eq(listings.id, row.id))
                .run()
          );

          await runWithRetry(
            "price_history.insert",
            { listingId: row.id, price: item.price ?? 0 },
            () =>
              db
                .insert(priceHistory)
                .values({
                  listingId: row.id,
                  price: item.price ?? 0,
                  observedAt: now,
                })
                .run()
          );
          metrics.priceHistoryInserted++;
          if (isChange) metrics.priceChangesDetected++;

          metrics.listingsUpdated++;
        }
      }

      await runWithRetry(
        "scrape_runs.updateRun",
        { runId: started.id, lastOverviewPage: page, metrics },
        () =>
          tracker.updateRun(started.id, {
            ...metrics,
            lastOverviewPage: page,
          })
      );
      console.log(
        `[sweep] progress: pages=${metrics.overviewPagesVisited} priceRows=${metrics.priceHistoryInserted} priceChanges=${metrics.priceChangesDetected} updated=${metrics.listingsUpdated}`
      );

      page++;
    }

    await runWithRetry(
      "scrape_runs.finishRun",
      { runId: started.id, status: "success" },
      () => tracker.finishRun(started.id, started.startedAt, "success")
    );
    console.log(`[sweep] done: status=success`);
  } catch (error) {
    await runWithRetry(
      "scrape_runs.finishRun",
      { runId: started.id, status: "error" },
      () =>
        tracker.finishRun(
          started.id,
          started.startedAt,
          "error",
          error instanceof Error ? error.message : String(error)
        )
    );
    console.log(`[sweep] done: status=error`);
  }
}
