import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  listings,
  priceHistory,
  sellers,
  sellerHistory,
  regions,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { RunTracker } from "../run-tracker";
import {
  fetchOverview,
  parseOverview,
  extractOverviewDebug,
} from "../sources/willhaben/overview";
import { fetchDetail, parseDetail } from "../sources/willhaben/detail";
import {
  buildRegionIndices as buildRegionIndicesShared,
  resolveRegionSlug,
} from "@/lib/region-matching";

type OverviewItem = ReturnType<typeof parseOverview>[number];
type DetailResult = NonNullable<ReturnType<typeof parseDetail>>;

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

// ----------------------------------------
// Small focused helpers
// ----------------------------------------

async function fetchOverviewPage(
  page: number,
  rowsPerPage: number
): Promise<{
  html: string;
  items: OverviewItem[];
  debug: ReturnType<typeof extractOverviewDebug>;
}> {
  let html: string;
  try {
    html = await fetchOverview(page, rowsPerPage);
  } catch (error) {
    const info = formatD1Error(error);
    throw new Error(
      `[discovery] overview fetch failed page=${page} message=${info.message}`
    );
  }
  const items = parseOverview(html);
  const debug = extractOverviewDebug(html);
  return { html, items, debug };
}

async function getExistingListingsMap(
  db: DrizzleD1Database<typeof import("@/db/schema")>,
  itemIds: string[]
): Promise<Map<string, number>> {
  if (itemIds.length === 0) return new Map();
  const existingRows = await db
    .select({ id: listings.id, platformListingId: listings.platformListingId })
    .from(listings)
    .where(inArray(listings.platformListingId, itemIds))
    .all();
  const map = new Map<string, number>();
  for (const r of existingRows) map.set(String(r.platformListingId), r.id);
  return map;
}

async function touchExistingListings(
  db: DrizzleD1Database<typeof import("@/db/schema")>,
  existingIds: number[],
  now: Date
): Promise<void> {
  if (existingIds.length === 0) return;
  const statements: BatchItem[] = [];
  for (const id of existingIds) {
    statements.push(
      db.update(listings).set({ lastSeenAt: now }).where(eq(listings.id, id))
    );
  }
  await runWithRetry(
    "listings.touch_last_seen.batch",
    { count: statements.length },
    // @ts-expect-error - batch item type is weird
    () => db.batch(statements)
  );
}

async function fetchDetailsForNewItems(
  newItems: OverviewItem[],
  metrics: { detailPagesFetched: number }
): Promise<Array<{ item: OverviewItem; detail: DetailResult }>> {
  const results: Array<{ item: OverviewItem; detail: DetailResult }> = [];
  for (const it of newItems) {
    try {
      const detailHtml = await fetchDetail(it.url);
      const detail = parseDetail(detailHtml);
      if (!detail) continue;
      metrics.detailPagesFetched++;
      results.push({ item: it, detail });
    } catch {
      // Skip on detail fetch error
      continue;
    }
  }
  return results;
}

async function upsertSellers(
  db: DrizzleD1Database<typeof import("@/db/schema")>,
  details: Array<{ item: OverviewItem; detail: DetailResult }>,
  now: Date
): Promise<Map<string, number>> {
  const sellerInputs = details
    .map((nd) => nd.detail?.seller)
    .filter(
      (s): s is NonNullable<DetailResult["seller"]> =>
        !!s && !!s.platformSellerId
    );

  const sellerByPlatformId = new Map<string, (typeof sellerInputs)[number]>();
  for (const s of sellerInputs)
    sellerByPlatformId.set(String(s.platformSellerId), s);
  const platformSellerIds = Array.from(sellerByPlatformId.keys());

  if (platformSellerIds.length === 0) {
    return new Map();
  }

  const sellerUpdateStatements: BatchItem[] = [];
  const sellerInsertStatements: BatchItem[] = [];
  const sellerHistoryInsertStatements: BatchItem[] = [];

  const existingSellers = await db
    .select({ id: sellers.id, platformSellerId: sellers.platformSellerId })
    .from(sellers)
    .where(
      and(
        eq(sellers.platform, "willhaben"),
        inArray(sellers.platformSellerId, platformSellerIds)
      )
    )
    .all();

  const existingSellerMap = new Map<string, number>();
  for (const r of existingSellers)
    existingSellerMap.set(String(r.platformSellerId), r.id);

  for (const [psid, s] of sellerByPlatformId.entries()) {
    const sid = existingSellerMap.get(psid);
    if (sid) {
      sellerUpdateStatements.push(
        db
          .update(sellers)
          .set({
            name: s.name ?? undefined,
            isPrivate: s.isPrivate ?? undefined,
            registerDate: s.registerDate ?? undefined,
            location: s.location ?? undefined,
            activeAdCount: s.activeAdCount ?? undefined,
            organisationName: s.organisationName ?? undefined,
            organisationPhone: s.organisationPhone ?? undefined,
            organisationEmail: s.organisationEmail ?? undefined,
            organisationWebsite: s.organisationWebsite ?? undefined,
            hasProfileImage: s.hasProfileImage ?? undefined,
            lastSeenAt: now,
            lastUpdatedAt: now,
          })
          .where(eq(sellers.id, sid))
      );
    } else {
      sellerInsertStatements.push(
        db.insert(sellers).values({
          platformSellerId: s.platformSellerId!,
          platform: "willhaben",
          name: s.name ?? null,
          isPrivate: s.isPrivate ?? null,
          isVerified: false,
          registerDate: s.registerDate ?? null,
          location: s.location ?? null,
          activeAdCount: s.activeAdCount ?? null,
          totalAdCount: null,
          organisationName: s.organisationName ?? null,
          organisationPhone: s.organisationPhone ?? null,
          organisationEmail: s.organisationEmail ?? null,
          organisationWebsite: s.organisationWebsite ?? null,
          hasProfileImage: s.hasProfileImage ?? null,
          firstSeenAt: now,
          lastSeenAt: now,
          lastUpdatedAt: now,
        })
      );
    }
  }

  if (sellerUpdateStatements.length > 0) {
    await runWithRetry(
      "sellers.update.batch",
      { count: sellerUpdateStatements.length },
      // @ts-expect-error - batch item type is weird
      () => db.batch(sellerUpdateStatements)
    );
  }
  if (sellerInsertStatements.length > 0) {
    await runWithRetry(
      "sellers.insert.batch",
      { count: sellerInsertStatements.length },
      // @ts-expect-error - batch item type is weird
      () => db.batch(sellerInsertStatements)
    );
  }

  const allSellerRows = await db
    .select({ id: sellers.id, platformSellerId: sellers.platformSellerId })
    .from(sellers)
    .where(
      and(
        eq(sellers.platform, "willhaben"),
        inArray(sellers.platformSellerId, platformSellerIds)
      )
    )
    .all();
  const sellerIdByPlatformId = new Map<string, number>();
  for (const r of allSellerRows)
    sellerIdByPlatformId.set(String(r.platformSellerId), r.id);

  for (const s of sellerInputs) {
    const sid = sellerIdByPlatformId.get(String(s.platformSellerId));
    if (!sid || typeof s.activeAdCount !== "number") continue;
    sellerHistoryInsertStatements.push(
      db.insert(sellerHistory).values({
        sellerId: sid,
        activeAdCount: s.activeAdCount,
        totalAdCount: null,
        observedAt: now,
      })
    );
  }
  if (sellerHistoryInsertStatements.length > 0) {
    await runWithRetry(
      "seller_history.insert.batch",
      { count: sellerHistoryInsertStatements.length },
      // @ts-expect-error - batch item type is weird
      () => db.batch(sellerHistoryInsertStatements)
    );
  }

  return sellerIdByPlatformId;
}

function buildListingUpsert(
  db: DrizzleD1Database<typeof import("@/db/schema")>,
  it: OverviewItem,
  d: DetailResult,
  sellerId: number | null,
  regionId: number | null,
  now: Date
): BatchItem {
  return db
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
      isLimited: !!d.duration?.isLimited,
      durationMonths: d.duration?.months ?? null,
      platform: "willhaben",
      url: it.url,
      externalId: it.id,
      regionId: regionId,
      sellerId: sellerId,
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
        isLimited: !!d.duration?.isLimited,
        durationMonths: d.duration?.months ?? null,
        regionId: regionId,
        lastSeenAt: now,
        lastScrapedAt: now,
        isActive: true,
        verificationStatus: "active",
      },
    });
}

async function upsertListings(
  db: DrizzleD1Database<typeof import("@/db/schema")>,
  details: Array<{ item: OverviewItem; detail: DetailResult }>,
  sellerIdByPlatformId: Map<string, number>,
  indices: ReturnType<typeof buildRegionIndicesShared>,
  slugToRegionId: Map<string, number>,
  now: Date
): Promise<string[]> {
  if (details.length === 0) return [];
  const listingInsertStatements: BatchItem[] = [];
  for (const nd of details) {
    const it = nd.item;
    const d = nd.detail;
    const resolvedSlug = resolveRegionSlug(indices, {
      state: it.state ?? null,
      district: it.district ?? null,
      city: it.city ?? null,
    });
    const regionId = resolvedSlug
      ? slugToRegionId.get(resolvedSlug) ?? null
      : null;
    if (!regionId) {
      console.warn(
        `[discovery] region not resolved id=${it.id} url=${it.url} state=${
          it.state ?? ""
        } district=${it.district ?? ""} city=${it.city ?? ""}`
      );
    }
    const sellerId = nd.detail?.seller?.platformSellerId
      ? sellerIdByPlatformId.get(String(nd.detail.seller.platformSellerId)) ??
        null
      : null;
    listingInsertStatements.push(
      buildListingUpsert(db, it, d, sellerId, regionId, now)
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
  return details.map((n) => n.item.id);
}

async function insertPriceHistory(
  db: DrizzleD1Database<typeof import("@/db/schema")>,
  platformListingIds: string[],
  details: Array<{ item: OverviewItem; detail: DetailResult }>,
  now: Date,
  metrics: { priceHistoryInserted: number }
): Promise<void> {
  if (platformListingIds.length === 0) return;
  const newIdsRows = await db
    .select({ id: listings.id, platformListingId: listings.platformListingId })
    .from(listings)
    .where(inArray(listings.platformListingId, platformListingIds))
    .all();
  const newIdMap = new Map<string, number>();
  for (const r of newIdsRows) newIdMap.set(String(r.platformListingId), r.id);

  const statements: BatchItem[] = [];
  for (const nd of details) {
    const id = newIdMap.get(nd.item.id);
    if (!id) continue;
    statements.push(
      db.insert(priceHistory).values({
        listingId: id,
        price: nd.item.price ?? 0,
        observedAt: now,
      })
    );
  }
  if (statements.length > 0) {
    await runWithRetry(
      "price_history.insert.batch",
      { count: statements.length },
      // @ts-expect-error - batch item type is weird
      () => db.batch(statements)
    );
    metrics.priceHistoryInserted += statements.length;
  }
}

async function processPage(
  db: DrizzleD1Database<typeof import("@/db/schema")>,
  page: number,
  rowsPerPage: number,
  now: Date,
  metrics: {
    overviewPagesVisited: number;
    detailPagesFetched: number;
    listingsDiscovered: number;
    listingsUpdated: number;
    priceHistoryInserted: number;
  },
  indices: ReturnType<typeof buildRegionIndicesShared>,
  slugToRegionId: Map<string, number>
): Promise<{ newFoundOnPage: number; shouldStop: boolean }> {
  const { items, debug } = await fetchOverviewPage(page, rowsPerPage);
  console.log(`[discovery] page=${page} items=${items.length}`);
  if (items.length === 0) {
    console.log(
      `[discovery] stop: empty items on page=${page} debug hasNextData=${
        debug.hasNextData
      } hasSearchResult=${debug.hasSearchResult} pageRequested=${
        debug.pageRequested ?? "n/a"
      } rowsRequested=${debug.rowsRequested ?? "n/a"} rowsFound=${
        debug.rowsFound ?? "n/a"
      } rowsReturned=${debug.rowsReturned ?? "n/a"} itemsCount=${
        debug.itemsCount ?? "n/a"
      }`
    );
    return { newFoundOnPage: 0, shouldStop: true };
  }
  metrics.overviewPagesVisited++;

  // Exclude clearly mislabelled items: price > 50000€
  const filteredItems = items.filter(
    (it) => typeof it.price !== "number" || it.price <= 50000
  );
  if (filteredItems.length !== items.length) {
    console.log(
      `[discovery] filtered overpriced items page=${page} removed=${
        items.length - filteredItems.length
      } kept=${filteredItems.length}`
    );
  }

  const itemIds = filteredItems.map((it) => it.id);
  const existingMap = await getExistingListingsMap(db, itemIds);

  const newItems = filteredItems.filter((it) => !existingMap.has(it.id));
  const existingItems = filteredItems.filter((it) => existingMap.has(it.id));

  metrics.listingsUpdated += existingItems.length;
  if (existingItems.length > 0) {
    const existingIds = existingItems.map(
      (it) => existingMap.get(it.id)!
    ) as number[];
    await touchExistingListings(db, existingIds, now);
  }

  const newWithDetail = await fetchDetailsForNewItems(newItems, metrics);

  let sellerIdByPlatformId = new Map<string, number>();
  if (newWithDetail.length > 0) {
    sellerIdByPlatformId = await upsertSellers(db, newWithDetail, now);
    const platformListingIds = await upsertListings(
      db,
      newWithDetail,
      sellerIdByPlatformId,
      indices,
      slugToRegionId,
      now
    );
    await insertPriceHistory(
      db,
      platformListingIds,
      newWithDetail,
      now,
      metrics
    );
  }

  const newFoundOnPage = newWithDetail.length;
  metrics.listingsDiscovered += newFoundOnPage;
  return { newFoundOnPage, shouldStop: false };
}

export async function runDiscovery(
  db: DrizzleD1Database<typeof import("@/db/schema")>
): Promise<void> {
  const tracker = new RunTracker(db);
  const started = await tracker.startRun("discovery");
  console.log(`[discovery] start`);
  // Build region indices and slug->id map once for the run
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
  const indices = buildRegionIndicesShared(
    allRegions.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      type: r.type,
      parentId: r.parentId,
    }))
  );
  const slugToRegionId = new Map<string, number>();
  for (const r of allRegions) slugToRegionId.set(r.slug, r.id);
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
    let consecutiveNoNew = 0;
    const maxPages = 15; // safety cap

    while (page <= maxPages && consecutiveNoNew < 3) {
      // Compute now once per page for consistency
      const now = new Date();

      const { newFoundOnPage, shouldStop } = await processPage(
        db,
        page,
        rowsPerPage,
        now,
        metrics,
        indices,
        slugToRegionId
      );

      if (shouldStop) break;

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
