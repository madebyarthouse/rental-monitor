import * as React from "react";
import {
  createAvgPricePerSqmScale,
  createLimitedPercentageScale,
  createColorScale,
} from "./color-scale";

/**
 * Calculates the relative luminance of a color using WCAG formula
 * Returns a value between 0 (dark) and 1 (light)
 */
function getLuminance(hex: string): number {
  // Remove # if present and handle 8-digit hex (with alpha)
  const cleanHex = hex.replace("#", "").slice(0, 6);
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const [rs, gs, bs] = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determines if text should be white or black based on background color brightness
 */
function getTextColorForBackground(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  // Use threshold of 0.5 - if luminance is below 0.5, use white text, otherwise black
  return luminance < 0.5 ? "white" : "black";
}

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
    const scale = createLimitedPercentageScale();
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
          <div className="flex flex-row flex-nowrap gap-1 md:grid md:gap-1.5">
            {ranges.map((r) => {
              const bgColor = scale(r.mid);
              const textColor = getTextColorForBackground(bgColor);
              return (
                <div
                  key={r.label}
                  className="flex items-center flex-1 gap-2.5 text-sm text-muted-foreground md:flex-row min-w-0"
                >
                  <div
                    className="relative w-full h-7 min-w-12 md:min-w-14 border border-border/50 shrink-0 flex items-center justify-center px-2"
                    style={{ backgroundColor: bgColor }}
                  >
                    <span
                      className="font-medium text-xs md:text-base whitespace-nowrap"
                      style={{ color: textColor }}
                    >
                      {r.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (metric === "avgPricePerSqm") {
    // Fixed bins for €/m²: 0–5, 5–10, 10–15, 15–20, 20+
    const scale = createAvgPricePerSqmScale();
    const ranges = [
      { label: "0–5€", mid: 2.5 },
      { label: "5–10€", mid: 7.5 },
      { label: "10–15€", mid: 12.5 },
      { label: "15–20€", mid: 17.5 },
      { label: "20€+", mid: 22.5 },
    ];
    return (
      <div className={className}>
        <div className=" border border-border bg-background/95 p-3 backdrop-blur-sm">
          <div className="text-base font-medium mb-2 text-foreground">
            Legende
          </div>
          <div className="flex flex-row flex-wrap md:flex-nowrap gap-1 md:grid md:gap-1.5">
            {ranges.map((r) => {
              const bgColor = scale(r.mid);
              const textColor = getTextColorForBackground(bgColor);
              return (
                <div
                  key={r.label}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground md:flex-row flex-1"
                >
                  <div
                    className="relative w-full h-7 min-w-12 md:min-w-14 border border-border/50 shrink-0 flex items-center justify-center px-2"
                    style={{ backgroundColor: bgColor }}
                  >
                    <span
                      className="font-medium text-xs md:text-base"
                      style={{ color: textColor }}
                    >
                      {r.label}
                    </span>
                  </div>
                </div>
              );
            })}
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
        <div className="flex flex-row flex-nowrap gap-1 md:grid md:gap-1.5">
          {ranges.map((r, i) => {
            const bgColor = scale(r.mid);
            const textColor = getTextColorForBackground(bgColor);
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 text-sm text-muted-foreground md:flex-row min-w-0"
              >
                <div
                  className="relative h-6 w-12 border border-border/50 shrink-0 md:h-4 md:w-8 flex items-center justify-center"
                  style={{ backgroundColor: bgColor }}
                >
                  <span
                    className="font-medium text-base md:text-lg md:hidden"
                    style={{ color: textColor }}
                  >
                    {r.label}
                  </span>
                </div>
                <span className="font-medium hidden md:inline">{r.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
