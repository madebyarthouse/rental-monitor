import * as React from "react";
import { createColorScale } from "./color-scale";

export function HeatmapLegend({
  min,
  max,
  avg,
  metric,
  className,
}: {
  min: number | null;
  max: number | null;
  avg: number | null;
  metric?: "limitedPercentage" | "avgPricePerSqm" | "totalListings";
  className?: string;
}) {
  if (metric === "limitedPercentage") {
    const scale = createColorScale(0, 100);
    const ranges = [
      { label: "0–20%", mid: 10 },
      { label: "21–40%", mid: 30 },
      { label: "41–60%", mid: 50 },
      { label: "61–80%", mid: 70 },
      { label: "81–100%", mid: 90 },
    ];
    return (
      <div className={className}>
        <div className="rounded-md border bg-background p-2 shadow-sm">
          <div className="text-xs mb-1 text-muted-foreground">Legende</div>
          <div className="grid gap-1">
            {ranges.map((r) => (
              <div
                key={r.label}
                className="flex items-center gap-2 text-[11px] text-muted-foreground"
              >
                <div
                  className="h-2 w-6 rounded"
                  style={{ backgroundColor: scale(r.mid) }}
                />
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (min == null || max == null) return null;

  const scale = createColorScale(min, max);
  const labels = [0.1, 0.3, 0.5, 0.7, 0.9].map((t) => min + (max - min) * t);

  return (
    <div className={className}>
      <div className="rounded-md border bg-background p-2 shadow-sm">
        <div className="text-xs mb-1 text-muted-foreground">Legende</div>
        <div className="grid gap-1">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[11px] text-muted-foreground"
            >
              <div
                className="h-2 w-6 rounded"
                style={{ backgroundColor: scale(min + (max - min) * t) }}
              />
              <span>{Math.round(labels[i])}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
