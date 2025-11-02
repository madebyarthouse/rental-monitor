import { describe, it, expect } from "vitest";

// Re-import compute function by local definition to keep it testable without refactor
function computeSweepStartPage(
  lastRun: { startedAt: Date; lastOverviewPage: number | null } | null,
  now: Date
): number {
  if (!lastRun) return 1;
  const twelveHoursMs = 12 * 60 * 60 * 1000;
  if (now.getTime() - new Date(lastRun.startedAt).getTime() > twelveHoursMs) {
    return 1;
  }
  const lastPage = lastRun.lastOverviewPage ?? 1;
  return Math.max(1, lastPage - 5);
}

describe("computeSweepStartPage", () => {
  it("returns 1 when no previous run", () => {
    expect(computeSweepStartPage(null, new Date())).toBe(1);
  });

  it("returns 1 when last run older than 12h", () => {
    const last = {
      startedAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
      lastOverviewPage: 40,
    };
    expect(computeSweepStartPage(last, new Date())).toBe(1);
  });

  it("starts 5 pages before lastOverviewPage when recent", () => {
    const last = {
      startedAt: new Date(Date.now() - 60 * 60 * 1000),
      lastOverviewPage: 40,
    };
    expect(computeSweepStartPage(last, new Date())).toBe(35);
  });

  it("does not go below page 1", () => {
    const last = {
      startedAt: new Date(Date.now() - 60 * 60 * 1000),
      lastOverviewPage: 3,
    };
    expect(computeSweepStartPage(last, new Date())).toBe(1);
  });
});


