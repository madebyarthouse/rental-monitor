import {
  X,
  ChevronRight,
  List,
  CheckCircle2,
  Euro,
  Ruler,
  Calculator,
  Timer,
} from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router";
import { useFilteredUrl } from "@/hooks/use-filtered-url";
import type { StatisticsSummary } from "@/services/statistics-service";
import type { HeatmapResult } from "@/services/map-service";

function formatNumber(
  n: number | null | undefined,
  opts?: Intl.NumberFormatOptions
): string {
  if (n == null || !Number.isFinite(n as number)) return "-";
  return new Intl.NumberFormat("de-AT", opts).format(n as number);
}

function getHeatmapValue(slug: string, heatmap?: HeatmapResult): number | null {
  if (!heatmap) return null;
  let values: Record<string, number | null> | undefined;
  if ("values" in heatmap) {
    values = heatmap.values as Record<string, number | null>;
  } else if ("byRegion" in heatmap && Array.isArray(heatmap.byRegion)) {
    values = Object.fromEntries(
      heatmap.byRegion.map((x) => [x.slug, x.value])
    ) as Record<string, number | null>;
  }
  return values?.[slug] ?? null;
}

type DistrictPopoverProps = {
  slug: string;
  name: string;
  stateSlug?: string;
  stateName?: string;
  stats?: StatisticsSummary;
  heatmap?: HeatmapResult;
  context: "country" | "state" | "district";
  currentStateSlug?: string;
  currentStateName?: string;
  activeDistrictSlug?: string;
  showCloseButton?: boolean;
  isMobileView?: boolean;
  onClose?: () => void;
  autoFocusClose?: boolean;
};

export function DistrictPopover({
  slug,
  name,
  stateSlug,
  stateName,
  stats,
  heatmap,
  context,
  currentStateSlug,
  currentStateName,
  activeDistrictSlug,
  showCloseButton,
  isMobileView,
  onClose,
  autoFocusClose,
}: DistrictPopoverProps) {
  const navigate = useNavigate();
  const getFilteredUrl = useFilteredUrl();
  const heatmapValue = getHeatmapValue(slug, heatmap);
  const metric = heatmap?.metric;

  const displayStateName =
    stateName ||
    (context === "state" || context === "district"
      ? currentStateName
      : undefined);

  const effectiveStateSlug =
    context === "country"
      ? stateSlug
      : context === "state" || context === "district"
      ? currentStateSlug
      : undefined;

  return (
    <div
      className={`text-sm bg-background rounded-none shadow-lg border border-border ${
        isMobileView ? "w-full" : "w-[300px]"
      } relative`}
    >
      {showCloseButton && (
        <button
          ref={(el) => {
            if (autoFocusClose && el) {
              setTimeout(() => el.focus(), 0);
            }
          }}
          onClick={onClose}
          className="absolute right-3 top-3 p-1 rounded-sm hover:bg-accent transition-colors"
          aria-label="Schließen"
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      )}
      <div className="px-4 pt-3 pb-3">
        {effectiveStateSlug &&
        slug &&
        !(context === "district" && activeDistrictSlug === slug) ? (
          <button
            onClick={() => {
              navigate(
                getFilteredUrl(`/${effectiveStateSlug}/${slug}`, {
                  target: "map",
                })
              );
            }}
            className="flex items-center gap-2 group w-full text-left font-semibold mb-2 text-lg text-foreground pr-6 hover:text-primary transition-colors cursor-pointer"
          >
            <span>{name}</span>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </button>
        ) : (
          <div className="font-semibold mb-2 text-base text-foreground pr-6">
            {name}
          </div>
        )}
        {displayStateName && (
          <>
            {context === "country" && stateSlug ? (
              <button
                onClick={() => {
                  navigate(getFilteredUrl(`/${stateSlug}`, { target: "map" }));
                }}
                className="flex items-center gap-2 group w-full text-left text-sm text-muted-foreground mb-2 hover:text-primary transition-colors cursor-pointer"
              >
                <span>{displayStateName}</span>
                <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
            ) : (
              <div className="text-xs text-muted-foreground mb-2">
                {displayStateName}
              </div>
            )}
          </>
        )}
      </div>
      <div className="border-b border-black"></div>
      {stats && (
        <div className="space-y-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <List className="size-4" aria-hidden />
              Inserate gesamt
            </span>
            <span
              className={`font-medium ${
                metric === "totalListings" ? "text-primary font-semibold" : ""
              }`}
            >
              {formatNumber(stats.total)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Euro className="size-4" aria-hidden />
              Preis (Durchschnitt)
            </span>
            <span className="font-medium">
              {formatNumber(stats.avgPrice, { maximumFractionDigits: 0 })} €
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Ruler className="size-4" aria-hidden />
              Fläche (Durchschnitt)
            </span>
            <span className="font-medium">
              {formatNumber(stats.avgArea, { maximumFractionDigits: 1 })} m²
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calculator className="size-4" aria-hidden />
              €/m² (Durchschnitt)
            </span>
            <span
              className={`font-medium ${
                metric === "avgPricePerSqm" ? "text-primary font-semibold" : ""
              }`}
            >
              {formatNumber(stats.avgPricePerSqm, {
                maximumFractionDigits: 1,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Timer className="size-4" aria-hidden />
              % befristet
            </span>
            <span
              className={`font-medium ${
                metric === "limitedPercentage"
                  ? "text-primary font-semibold"
                  : ""
              }`}
            >
              {stats.limitedPct == null
                ? "-"
                : `${formatNumber(stats.limitedPct, {
                    maximumFractionDigits: 1,
                  })}%`}
            </span>
          </div>
        </div>
      )}
      {!stats && heatmapValue != null && Number.isFinite(heatmapValue) && (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          {metric === "limitedPercentage" &&
            `${Math.round(heatmapValue)}% befristet`}
          {metric === "avgPricePerSqm" && `${Math.round(heatmapValue)} €/m²`}
          {metric === "totalListings" && `${Math.round(heatmapValue)} Inserate`}
        </div>
      )}
    </div>
  );
}
