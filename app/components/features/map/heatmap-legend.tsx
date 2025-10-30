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
        <div className=" border border-border bg-background/95 p-3 backdrop-blur-sm">
          <div className="text-base font-medium mb-2 text-foreground">
            Legende
          </div>
          <div className="flex flex-row flex-wrap gap-1.5 md:grid md:gap-1.5">
            {ranges.map((r) => (
              <div
                key={r.label}
                className="flex items-center gap-2.5 text-sm text-muted-foreground"
              >
                <div
                  className="h-4 w-8  border border-border/50 shrink-0"
                  style={{ backgroundColor: scale(r.mid) }}
                />
                <span className="font-medium">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (metric === "avgPricePerSqm") {
    // Fixed bins for €/m²: 0–5, 5–10, 10–15, 15–20, 20+
    const scale = createColorScale(0, 20);
    const ranges = [
      { label: "0–5", mid: 2.5 },
      { label: "5–10", mid: 7.5 },
      { label: "10–15", mid: 12.5 },
      { label: "15–20", mid: 17.5 },
      { label: "20+", mid: 20 },
    ];
    return (
      <div className={className}>
        <div className=" border border-border bg-background/95 p-3 backdrop-blur-sm">
          <div className="text-base font-medium mb-2 text-foreground">
            Legende
          </div>
          <div className="flex flex-row flex-wrap gap-1.5 md:grid md:gap-1.5">
            {ranges.map((r) => (
              <div
                key={r.label}
                className="flex items-center gap-2.5 text-sm text-muted-foreground"
              >
                <div
                  className="h-4 w-8  border border-border/50 shrink-0"
                  style={{ backgroundColor: scale(r.mid) }}
                />
                <span className="font-medium">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (min == null || max == null) return null;

  const scale = createColorScale(min, max);
  // Use same 5-step binning as getFillColor: step = (max - min) / 5
  const step = (max - min) / 5;
  const ranges = [
    {
      label: `${Math.round(min)}–${Math.round(min + step)}`,
      mid: min + step * 0.5,
    },
    {
      label: `${Math.round(min + step)}–${Math.round(min + step * 2)}`,
      mid: min + step * 1.5,
    },
    {
      label: `${Math.round(min + step * 2)}–${Math.round(min + step * 3)}`,
      mid: min + step * 2.5,
    },
    {
      label: `${Math.round(min + step * 3)}–${Math.round(min + step * 4)}`,
      mid: min + step * 3.5,
    },
    {
      label: `${Math.round(min + step * 4)}–${Math.round(max)}`,
      mid: min + step * 4.5,
    },
  ];

  return (
    <div className={className}>
      <div className=" border border-border bg-background/95 p-3 backdrop-blur-sm">
        <div className="text-base font-medium mb-2 text-foreground">
          Legende
        </div>
        <div className="flex flex-row flex-wrap gap-1.5 md:grid md:gap-1.5">
          {ranges.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 text-sm text-muted-foreground"
            >
              <div
                className="h-4 w-8 border border-border/50 shrink-0"
                style={{ backgroundColor: scale(r.mid) }}
              />
              <span className="font-medium">{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
