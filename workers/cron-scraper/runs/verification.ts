import type { DrizzleD1Database } from "drizzle-orm/d1";
import { listings } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { RunTracker } from "../run-tracker";
import { fetchDetail, parseDetail } from "../sources/willhaben/detail";

export async function runVerification(
  db: DrizzleD1Database<typeof import("@/db/schema")>
): Promise<void> {
  const tracker = new RunTracker(db);
  const started = await tracker.startRun("verification");
  console.log(`[verification] start`);
  const metrics = {
    detailPagesFetched: 0,
    listingsVerified: 0,
    listingsNotFound: 0,
  };

  try {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const candidates = await db
      .select({ id: listings.id, url: listings.url })
      .from(listings)
      .where(
        and(eq(listings.isActive, true), lt(listings.lastSeenAt, cutoffDate))
      )
      .limit(100)
      .all();
    console.log(`[verification] candidates=${candidates.length}`);

    for (const c of candidates) {
      try {
        const html = await fetchDetail(c.url);
        metrics.detailPagesFetched++;
        const detail = parseDetail(html);
        const now = new Date();
        if (detail) {
          await db
            .update(listings)
            .set({
              lastVerifiedAt: now,
              verificationStatus: "active",
              lastSeenAt: now,
            })
            .where(eq(listings.id, c.id))
            .run();
          metrics.listingsVerified++;
          console.log(`[verification] ok id=${c.id}`);
        } else {
          const current = await db
            .select({ notFoundCount: listings.notFoundCount })
            .from(listings)
            .where(eq(listings.id, c.id))
            .get();
          const nextCount = (current?.notFoundCount ?? 0) + 1;
          await db
            .update(listings)
            .set({
              lastVerifiedAt: now,
              verificationStatus: "not_found",
              notFoundCount: nextCount,
              isActive: false,
              deactivatedAt: now,
            })
            .where(eq(listings.id, c.id))
            .run();
          metrics.listingsNotFound++;
          console.log(`[verification] not_found id=${c.id}`);
        }
      } catch {
        const now = new Date();
        const current = await db
          .select({ notFoundCount: listings.notFoundCount })
          .from(listings)
          .where(eq(listings.id, c.id))
          .get();
        const nextCount = (current?.notFoundCount ?? 0) + 1;
        await db
          .update(listings)
          .set({
            lastVerifiedAt: now,
            verificationStatus: "not_found",
            notFoundCount: nextCount,
          })
          .where(eq(listings.id, c.id))
          .run();
        metrics.listingsNotFound++;
        console.log(`[verification] error->not_found id=${c.id}`);
      }

      await tracker.updateRun(started.id, metrics);
    }

    await tracker.finishRun(started.id, started.startedAt, "success");
    console.log(
      `[verification] done: status=success verified=${metrics.listingsVerified} notFound=${metrics.listingsNotFound}`
    );
  } catch (error) {
    await tracker.finishRun(
      started.id,
      started.startedAt,
      "error",
      error instanceof Error ? error.message : String(error)
    );
    console.log(`[verification] done: status=error`);
  }
}
