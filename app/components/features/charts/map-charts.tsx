import * as React from "react";
import { PriceHistogram } from "@/components/features/stats/price-histogram";
import { LimitedPie } from "@/components/features/stats/limited-pie";

export function MapCharts({
  priceHistogram,
  limitedCounts,
  className,
}: {
  priceHistogram: {
    buckets: Array<{ start: number; end: number | null; count: number }>;
  };
  limitedCounts: { limited: number; unlimited: number };
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border p-3">
          <div className="mb-2 text-sm font-medium">Preisverteilung</div>
          <PriceHistogram buckets={priceHistogram.buckets} />
        </div>
        <div className="rounded-md border p-3">
          <div className="mb-2 text-sm font-medium">
            Befristet vs. Unbefristet
          </div>
          <LimitedPie
            limited={limitedCounts.limited}
            unlimited={limitedCounts.unlimited}
          />
        </div>
      </div>
    </div>
  );
}
