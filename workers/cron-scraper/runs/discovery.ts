import type { DrizzleD1Database } from "drizzle-orm/d1";
import { listings, priceHistory } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { RunTracker } from "../run-tracker";
import {
  fetchOverview,
  parseOverview,
  extractOverviewDebug,
} from "../sources/willhaben/overview";
import { fetchDetail, parseDetail } from "../sources/willhaben/detail";
import { upsertSeller } from "../utils/seller";

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
    const maxPages = 15; // safety cap

    while (page <= maxPages && consecutiveNoNew < 3) {
      const html = await fetchOverview(page, rowsPerPage);
      const items = parseOverview(html);
      console.log(`[discovery] page=${page} items=${items.length}`);
      if (items.length === 0) {
        const dbg = extractOverviewDebug(html);
        console.log(
          `[discovery] stop: empty items on page=${page} debug hasNextData=${
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
      metrics.overviewPagesVisited++;
      if (items.length === 0) break;

      // Compute now once per page for consistency
      const now = new Date();

      // Bulk fetch existing rows for all items on this page
      const itemIds = items.map((it) => it.id);
      const existingRows = await db
        .select({
          id: listings.id,
          platformListingId: listings.platformListingId,
        })
        .from(listings)
        .where(inArray(listings.platformListingId, itemIds))
        .all();
      const existingMap = new Map<string, number>();
      for (const r of existingRows)
        existingMap.set(String(r.platformListingId), r.id);

      // Prepare batched statements
      const touchExistingStatements: BatchItem[] = [];
      const listingInsertStatements: BatchItem[] = [];
      const priceHistoryInsertStatements: BatchItem[] = [];
      const detailUpdateStatements: BatchItem[] = [];

      const newItems = items.filter((it) => !existingMap.has(it.id));
      const existingItems = items.filter((it) => existingMap.has(it.id));

      newFoundOnPage = newItems.length;
      metrics.listingsDiscovered += newItems.length;
      metrics.listingsUpdated += existingItems.length;

      // Touch existing: lastSeenAt only
      for (const it of existingItems) {
        const id = existingMap.get(it.id)!;
        touchExistingStatements.push(
          db
            .update(listings)
            .set({ lastSeenAt: now })
            .where(eq(listings.id, id))
        );
      }

      // Insert new listings (on conflict update) without seller, seller is set after detail
      for (const it of newItems) {
        listingInsertStatements.push(
          db
            .insert(listings)
            .values({
              platformListingId: it.id,
              title: it.title,
              price: it.price ?? 0,
              area: it.area ?? null,
              rooms: it.rooms ?? null,
              zipCode: it.zipCode ?? null,
              city: it.city ?? null,
              district: it.district ?? null,
              state: it.state ?? null,
              latitude: it.latitude ?? null,
              longitude: it.longitude ?? null,
              isLimited: false,
              durationMonths: null,
              platform: "willhaben",
              url: it.url,
              externalId: it.id,
              sellerId: null,
              firstSeenAt: now,
              lastSeenAt: now,
              lastScrapedAt: now,
              isActive: true,
              verificationStatus: "active",
            })
            .onConflictDoUpdate({
              target: listings.url,
              set: {
                title: it.title,
                price: it.price ?? 0,
                area: it.area ?? null,
                rooms: it.rooms ?? null,
                zipCode: it.zipCode ?? null,
                city: it.city ?? null,
                district: it.district ?? null,
                state: it.state ?? null,
                latitude: it.latitude ?? null,
                longitude: it.longitude ?? null,
                lastSeenAt: now,
                lastScrapedAt: now,
                isActive: true,
                verificationStatus: "active",
              },
            })
        );
      }

      // Execute batched statements for existing touches and new inserts
      if (touchExistingStatements.length > 0) {
        await runWithRetry(
          "listings.touch_last_seen.batch",
          { count: touchExistingStatements.length },
          // @ts-expect-error - batch item type is weird
          () => db.batch(touchExistingStatements)
        );
      }
      if (listingInsertStatements.length > 0) {
        await runWithRetry(
          "listings.upsert.batch",
          { count: listingInsertStatements.length },
          // @ts-expect-error - batch item type is weird
          () => db.batch(listingInsertStatements)
        );
      }

      // After inserts, bulk fetch ids for new items and insert price history in batch
      if (newItems.length > 0) {
        const newIdsRows = await db
          .select({
            id: listings.id,
            platformListingId: listings.platformListingId,
          })
          .from(listings)
          .where(
            inArray(
              listings.platformListingId,
              newItems.map((n) => n.id)
            )
          )
          .all();
        const newIdMap = new Map<string, number>();
        for (const r of newIdsRows)
          newIdMap.set(String(r.platformListingId), r.id);

        for (const it of newItems) {
          const id = newIdMap.get(it.id);
          if (!id) continue;
          priceHistoryInsertStatements.push(
            db.insert(priceHistory).values({
              listingId: id,
              price: it.price ?? 0,
              observedAt: now,
            })
          );
        }

        if (priceHistoryInsertStatements.length > 0) {
          await runWithRetry(
            "price_history.insert.batch",
            { count: priceHistoryInsertStatements.length },
            // @ts-expect-error - batch item type is weird
            () => db.batch(priceHistoryInsertStatements)
          );
          metrics.priceHistoryInserted += priceHistoryInsertStatements.length;
        }

        // Fetch details and prepare batched updates for new items
        for (const it of newItems) {
          const detailHtml = await fetchDetail(it.url);
          const detail = parseDetail(detailHtml);
          if (!detail) continue;
          metrics.detailPagesFetched++;
          const enrichedSellerId = await upsertSeller(
            db,
            "willhaben",
            detail.seller
          );
          detailUpdateStatements.push(
            db
              .update(listings)
              .set({
                isLimited: !!detail.duration?.isLimited,
                durationMonths: detail.duration?.months ?? null,
                sellerId: enrichedSellerId ?? null,
                lastScrapedAt: now,
              })
              .where(eq(listings.platformListingId, it.id))
          );
        }

        if (detailUpdateStatements.length > 0) {
          await runWithRetry(
            "listings.detail_update.batch",
            { count: detailUpdateStatements.length },
            // @ts-expect-error - batch item type is weird
            () => db.batch(detailUpdateStatements)
          );
        }
      }

      await runWithRetry(
        "scrape_runs.updateRun",
        { runId: started.id, metrics },
        () => tracker.updateRun(started.id, metrics)
      );
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

    await runWithRetry(
      "scrape_runs.finishRun",
      { runId: started.id, status: "success" },
      () => tracker.finishRun(started.id, started.startedAt, "success")
    );
    console.log(`[discovery] done: status=success`);
  } catch (error) {
    const errInfo = formatD1Error(error);
    console.error(
      `[discovery] error name=${errInfo.name} message=${errInfo.message}${
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
    console.log(`[discovery] done: status=error`);
  }
}
