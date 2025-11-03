import type { DrizzleD1Database } from "drizzle-orm/d1";
import { listings } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { RunTracker } from "../run-tracker";
import { fetchDetail, parseDetail } from "../sources/willhaben/detail";

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
          await runWithRetry("listings.verify_active", { id: c.id }, () =>
            db
              .update(listings)
              .set({
                lastVerifiedAt: now,
                verificationStatus: "active",
                lastSeenAt: now,
              })
              .where(eq(listings.id, c.id))
              .run()
          );
          metrics.listingsVerified++;
          console.log(`[verification] ok id=${c.id}`);
        } else {
          const current = await db
            .select({ notFoundCount: listings.notFoundCount })
            .from(listings)
            .where(eq(listings.id, c.id))
            .get();
          const nextCount = (current?.notFoundCount ?? 0) + 1;
          await runWithRetry("listings.verify_not_found", { id: c.id }, () =>
            db
              .update(listings)
              .set({
                lastVerifiedAt: now,
                verificationStatus: "not_found",
                notFoundCount: nextCount,
                isActive: false,
                deactivatedAt: now,
              })
              .where(eq(listings.id, c.id))
              .run()
          );
          metrics.listingsNotFound++;
          console.log(`[verification] not_found id=${c.id}`);
        }
      } catch (e) {
        const errInfoInner = formatD1Error(e);
        console.error(
          `[verification] detail error name=${errInfoInner.name} message=${
            errInfoInner.message
          }${
            errInfoInner.causeMessage
              ? ` cause=${errInfoInner.causeMessage}`
              : ""
          } id=${c.id}`
        );
        const now = new Date();
        const current = await db
          .select({ notFoundCount: listings.notFoundCount })
          .from(listings)
          .where(eq(listings.id, c.id))
          .get();
        const nextCount = (current?.notFoundCount ?? 0) + 1;
        await runWithRetry(
          "listings.verify_error_to_not_found",
          { id: c.id },
          () =>
            db
              .update(listings)
              .set({
                lastVerifiedAt: now,
                verificationStatus: "not_found",
                notFoundCount: nextCount,
              })
              .where(eq(listings.id, c.id))
              .run()
        );
        metrics.listingsNotFound++;
        console.log(`[verification] error->not_found id=${c.id}`);
      }

      await runWithRetry(
        "scrape_runs.updateRun",
        { runId: started.id, metrics },
        () => tracker.updateRun(started.id, metrics)
      );
    }

    await runWithRetry(
      "scrape_runs.finishRun",
      { runId: started.id, status: "success" },
      () => tracker.finishRun(started.id, started.startedAt, "success")
    );
    console.log(
      `[verification] done: status=success verified=${metrics.listingsVerified} notFound=${metrics.listingsNotFound}`
    );
  } catch (error) {
    const errInfo = formatD1Error(error);
    console.error(
      `[verification] error name=${errInfo.name} message=${errInfo.message}${
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
    console.log(`[verification] done: status=error`);
  }
}
