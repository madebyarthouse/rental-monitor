import type { DrizzleD1Database } from "drizzle-orm/d1";
import { listings, priceHistory } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { RunTracker } from "../run-tracker";
import {
  fetchOverview,
  parseOverview,
  extractOverviewDebug,
} from "../sources/willhaben/overview";
import type { BatchItem } from "drizzle-orm/batch";

function formatD1Error(error: unknown): {
  name: string;
  message: string;
  causeMessage?: string;
  stack?: string;
  causeStack?: string;
  combined: string;
} {
  const e = error as any;
  const name = e?.name ?? "Error";
  const message = e?.message ? String(e.message) : String(e);
  const causeMessage = e?.cause?.message ? String(e.cause.message) : undefined;
  const stack = e?.stack ? String(e.stack) : undefined;
  const causeStack = e?.cause?.stack ? String(e.cause.stack) : undefined;
  const combined = causeMessage
    ? `${name}: ${message} | cause: ${causeMessage}`
    : `${name}: ${message}`;
  return { name, message, causeMessage, stack, causeStack, combined };
}

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
      const { name, message, causeMessage } = formatD1Error(error);
      const matchText = `${message} ${causeMessage ?? ""}`;
      const shouldRetry =
        /locked|SQLITE_BUSY|SQLITE_LOCKED|busy|code\s*5|code\s*6|code\s*49/i.test(
          matchText
        );
      console.error(
        `[retry] op=${opName} attempt=${
          attempt + 1
        }/${attempts} willRetry=${shouldRetry} errorName=${name} errorMessage=${message}${
          causeMessage ? ` cause=${causeMessage}` : ""
        }${ctx ? ` ctx=${JSON.stringify(ctx)}` : ""}`
      );
      if (!shouldRetry) throw error;
      const delay = baseDelayMs * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  console.error(
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
      if (items.length === 0) {
        const dbg = extractOverviewDebug(html);
        console.log(
          `[sweep] stop: empty items on page=${page} debug hasNextData=${
            dbg.hasNextData
          } hasSearchResult=${dbg.hasSearchResult} pageRequested=${
            dbg.pageRequested ?? "n/a"
          } rowsRequested=${dbg.rowsRequested ?? "n/a"} rowsFound=${
            dbg.rowsFound ?? "n/a"
          } rowsReturned=${dbg.rowsReturned ?? "n/a"} itemsCount=${
            dbg.itemsCount ?? "n/a"
          }`
        );
        break;
      }

      // Bulk fetch existing listings for all items on this page
      const now = new Date();
      const itemIds = items.map((it) => it.id);
      const existingRows = await db
        .select({
          id: listings.id,
          price: listings.price,
          platformListingId: listings.platformListingId,
        })
        .from(listings)
        .where(inArray(listings.platformListingId, itemIds))
        .all();

      const idToRow = new Map<string, { id: number; price: number | null }>();
      for (const r of existingRows) {
        idToRow.set(String(r.platformListingId), { id: r.id, price: r.price });
      }

      // Prepare batched updates/inserts
      const updateStatements: BatchItem[] = [];
      const insertStatements: BatchItem[] = [];

      for (const item of items) {
        const row = idToRow.get(item.id);
        if (!row) continue; // Sweep does not create new listings; skip unknown

        const hasPrice =
          typeof item.price === "number" && Number.isFinite(item.price);
        if (!hasPrice) continue;

        const isChange =
          typeof row.price === "number" && row.price !== item.price;

        updateStatements.push(
          db
            .update(listings)
            .set({
              lastSeenAt: now,
              lastScrapedAt: now,
              price: item.price,
              isActive: true,
            })
            .where(eq(listings.id, row.id))
        );

        insertStatements.push(
          db.insert(priceHistory).values({
            listingId: row.id,
            price: item.price ?? 0,
            observedAt: now,
          })
        );

        metrics.listingsUpdated++;
        metrics.priceHistoryInserted++;
        if (isChange) metrics.priceChangesDetected++;
      }

      // Execute batched statements to minimize API calls
      if (updateStatements.length > 0) {
        await runWithRetry(
          "listings.update.batch",
          { count: updateStatements.length },
          // @ts-expect-error - batch item type is weird
          () => db.batch(updateStatements)
        );
      }
      if (insertStatements.length > 0) {
        await runWithRetry(
          "price_history.insert.batch",
          { count: insertStatements.length },
          // @ts-expect-error - batch item type is weird
          () => db.batch(insertStatements)
        );
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
    const errInfo = formatD1Error(error);
    console.error(
      `[sweep] error name=${errInfo.name} message=${errInfo.message}${
        errInfo.causeMessage ? ` cause=${errInfo.causeMessage}` : ""
      }`
    );
    await runWithRetry(
      "scrape_runs.finishRun",
      { runId: started.id, status: "error" },
      () =>
        tracker.finishRun(
          started.id,
          started.startedAt,
          "error",
          errInfo.combined
        )
    );
    console.log(`[sweep] done: status=error`);
  }
}
