import * as React from "react";
import { PriceHistogram } from "@/components/features/stats/price-histogram";
import { LimitedPie } from "@/components/features/stats/limited-pie";
import { StatisticsTable } from "./statistics-table";
import { GroupedBarCharts } from "./grouped-bar-charts";
import type { StatisticsSummary } from "@/services/statistics-service";

type GroupedStat = {
  slug: string;
  name: string;
  stats: StatisticsSummary;
};

export function MapCharts({
  priceHistogram,
  limitedCounts,
  groupedStats,
  groupLevel,
  activeSlug,
  className,
}: {
  priceHistogram: {
    buckets: Array<{ start: number; end: number | null; count: number }>;
  };
  limitedCounts: { limited: number; unlimited: number };
  groupedStats?: GroupedStat[];
  groupLevel?: "state" | "district";
  activeSlug?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="grid border-t  border-black md:grid-cols-2">
        <div className="border-r border-b border-black p-8">
          <div className="mb-2 text-base font-medium">Preisverteilung</div>
          <PriceHistogram buckets={priceHistogram.buckets} />
        </div>
        <div className="border-b border-black p-8">
          <div className="mb-2 text-base font-medium">
            Befristet vs. Unbefristet
          </div>
          <LimitedPie
            limited={limitedCounts.limited}
            unlimited={limitedCounts.unlimited}
          />
        </div>
      </div>
      {groupedStats && groupedStats.length > 0 && groupLevel && (
        <>
          <GroupedBarCharts groupedStats={groupedStats} className="mt-6" activeSlug={activeSlug} />
          <StatisticsTable groupedStats={groupedStats} className="mt-6" activeSlug={activeSlug} />
        </>
      )}
    </div>
  );
}
