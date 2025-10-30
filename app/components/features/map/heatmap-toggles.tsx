import * as React from "react";
import { useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { key: "limitedPercentage", label: "% befristet" },
  { key: "avgPricePerSqm", label: "Ø €/m²" },
] as const;

type MetricKey = (typeof OPTIONS)[number]["key"];

export function HeatmapToggles({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const current = (new URLSearchParams(location.search).get("metric") ||
    "limitedPercentage") as MetricKey;

  const setMetric = (m: MetricKey) => {
    const sp = new URLSearchParams(location.search);
    sp.set("metric", m);
    navigate({ pathname: location.pathname, search: sp.toString() });
  };

  return (
    <div
      className={cn(
        "inline-flex rounded-md border bg-background p-1 text-xs shadow-sm",
        className
      )}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => setMetric(opt.key)}
          className={cn(
            "px-2 py-1 rounded-sm cursor-pointer",
            opt.key === current
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={opt.key === current}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
