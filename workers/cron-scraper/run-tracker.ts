import type { DrizzleD1Database } from "drizzle-orm/d1";
import { scrapeRuns } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export type RunType = "discovery" | "sweep" | "verification";
export type RunStatus = "pending" | "running" | "success" | "error";

export interface RunMetrics {
  overviewPagesVisited?: number;
  detailPagesFetched?: number;
  listingsDiscovered?: number;
  listingsUpdated?: number;
  listingsVerified?: number;
  listingsNotFound?: number;
  priceHistoryInserted?: number;
  priceChangesDetected?: number;
  lastOverviewPage?: number;
}

export interface StartedRun {
  id: number;
  startedAt: Date;
}

export class RunTracker {
  constructor(
    private readonly db: DrizzleD1Database<typeof import("@/db/schema")>
  ) {}

  async startRun(type: RunType): Promise<StartedRun> {
    const startedAt = new Date();
    await this.db
      .insert(scrapeRuns)
      .values({
        type,
        status: "running",
        startedAt,
      })
      .run();

    // Fetch the most recent run id
    const created = await this.db
      .select({ id: scrapeRuns.id })
      .from(scrapeRuns)
      .orderBy(desc(scrapeRuns.id))
      .get();

    return { id: created?.id ?? 0, startedAt };
  }

  async updateRun(id: number, metrics: RunMetrics): Promise<void> {
    if (!id) return;
    await this.db
      .update(scrapeRuns)
      .set(metrics)
      .where(eq(scrapeRuns.id, id))
      .run();
  }

  async finishRun(
    id: number,
    startedAt: Date,
    status: Exclude<RunStatus, "running">,
    errorMessage?: string
  ): Promise<void> {
    if (!id) return;
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    await this.db
      .update(scrapeRuns)
      .set({ status, finishedAt, durationMs, errorMessage })
      .where(eq(scrapeRuns.id, id))
      .run();
  }

  async getLastRunOfType(type: RunType): Promise<{
    id: number;
    startedAt: Date | null;
    lastOverviewPage: number | null;
  } | null> {
    const row = await this.db
      .select({
        id: scrapeRuns.id,
        startedAt: scrapeRuns.startedAt,
        lastOverviewPage: scrapeRuns.lastOverviewPage,
      })
      .from(scrapeRuns)
      .where(eq(scrapeRuns.type, type))
      .orderBy(desc(scrapeRuns.startedAt))
      .get();
    if (!row) return null;
    return row;
  }
}
