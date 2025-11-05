import * as React from "react";
import { PriceHistogram } from "@/components/features/stats/price-histogram";
import { LimitedPie } from "@/components/features/stats/limited-pie";
// removed: LimitedVsUnlimitedBars
import { LimitedVsUnlimitedByRegion } from "@/components/features/charts/limited-vs-unlimited-by-region";
import { StatisticsTable } from "./statistics-table";
import { GroupedBarCharts } from "./grouped-bar-charts";
import type { StatisticsSummary } from "@/services/statistics-service";

type GroupedStat = {
  slug: string;
  name: string;
  stats: StatisticsSummary;
};

function computeLimitedPctSortOrder(
  groupedStats?: GroupedStat[]
): string[] | undefined {
  if (!groupedStats || groupedStats.length === 0) return undefined;
  const byLimitedPctDesc = [...groupedStats].sort((a, b) => {
    const aTotal = a.stats.total;
    const bTotal = b.stats.total;
    const aLimited = a.stats.limitedCount;
    const bLimited = b.stats.limitedCount;
    const aPct = aTotal > 0 ? aLimited / aTotal : 0;
    const bPct = bTotal > 0 ? bLimited / bTotal : 0;
    return bPct - aPct;
  });
  return byLimitedPctDesc.map((g) => g.slug);
}

export function MapCharts({
  priceHistogram,
  limitedCounts,
  groupedStats,
  groupLevel,
  activeSlug,
  className,
  groupedLimitedPremium,
}: {
  priceHistogram: {
    buckets: Array<{ start: number; end: number | null; count: number }>;
  };
  limitedCounts: { limited: number; unlimited: number };
  groupedStats?: GroupedStat[];
  groupLevel?: "state" | "district";
  activeSlug?: string;
  className?: string;
  groupedLimitedPremium?: Array<{
    slug: string;
    name: string;
    premiumPct: number | null;
    limitedAvgPricePerSqm: number | null;
    unlimitedAvgPricePerSqm: number | null;
  }>;
}) {
  const sortOrder = React.useMemo(
    () => computeLimitedPctSortOrder(groupedStats),
    [groupedStats]
  );
  return (
    <div className={className}>
      <div className="grid border-t  border-black md:grid-cols-2">
        <div className="border-r border-b border-black p-4 lg:p-8">
          <div className="mb-2 text-base font-medium">Preisverteilung</div>
          <PriceHistogram buckets={priceHistogram.buckets} />
        </div>
        <div className="border-b border-black p-4 lg:p-8">
          <div className="mb-2 text-base font-medium">
            Befristet vs. Unbefristet
          </div>
          <LimitedPie
            limited={limitedCounts.limited}
            unlimited={limitedCounts.unlimited}
          />
        </div>
      </div>

      {groupedStats && groupedStats.length > 0 && (
        <div className="my-6 px-4 lg:px-8 text-base font-medium">
          {groupLevel === "state"
            ? "Vergleich zwischen den Bundesländern"
            : "Vergleich zwischen den Bezirken"}
          <p className="text-sm text-gray-500">
            Sortiert nach % der Befristung absteigend
          </p>
        </div>
      )}

      {groupedStats && groupedStats.length > 0 && groupLevel && (
        <>
          <GroupedBarCharts
            groupedStats={groupedStats}
            className="mt-6"
            activeSlug={activeSlug}
            groupedLimitedPremium={groupedLimitedPremium}
            sortOrder={sortOrder}
          />
          <StatisticsTable
            groupedStats={groupedStats}
            className="mt-6"
            activeSlug={activeSlug}
            sortOrder={sortOrder}
          />
        </>
      )}
    </div>
  );
}
