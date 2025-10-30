import { X } from "lucide-react";
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
  showButtons?: boolean;
  showCloseButton?: boolean;
  isMobileView?: boolean;
  onClose?: () => void;
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
  showButtons,
  showCloseButton,
  isMobileView,
  onClose,
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

  // Compute which buttons to show
  const buttons = React.useMemo(() => {
    if (!showButtons || !effectiveStateSlug) return [];

    const buttonList: Array<{
      label: string;
      onClick: () => void;
    }> = [];

    // Show state navigation button only in country context
    if (context === "country" && stateSlug) {
      buttonList.push({
        label: `Zu ${displayStateName || stateSlug} navigieren`,
        onClick: () => {
          navigate(getFilteredUrl(`/${stateSlug}`, { target: "map" }));
        },
      });
    }

    // Show district navigation button if not already on that district
    if (
      slug &&
      effectiveStateSlug &&
      !(context === "district" && activeDistrictSlug === slug)
    ) {
      buttonList.push({
        label: `Zu ${name} navigieren`,
        onClick: () => {
          navigate(
            getFilteredUrl(`/${effectiveStateSlug}/${slug}`, {
              target: "map",
            })
          );
        },
      });
    }

    return buttonList;
  }, [
    showButtons,
    effectiveStateSlug,
    context,
    stateSlug,
    displayStateName,
    slug,
    name,
    activeDistrictSlug,
    navigate,
    getFilteredUrl,
  ]);

  return (
    <div
      className={`px-3 py-2.5 text-sm bg-background rounded-md shadow-lg border border-border ${
        isMobileView ? "w-full" : "w-[300px]"
      } relative`}
    >
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 p-1 rounded-sm hover:bg-accent transition-colors"
          aria-label="Schließen"
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      )}
      <div className="font-semibold mb-2 text-base text-foreground pr-6">
        {name}
      </div>
      {displayStateName && (
        <div className="text-xs text-muted-foreground mb-2">
          {displayStateName}
        </div>
      )}
      {stats && (
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inserate gesamt</span>
            <span
              className={`font-medium ${
                metric === "totalListings" ? "text-primary font-semibold" : ""
              }`}
            >
              {formatNumber(stats.total)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ø Preis</span>
            <span className="font-medium">
              {formatNumber(stats.avgPrice, { maximumFractionDigits: 0 })} €
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ø Fläche</span>
            <span className="font-medium">
              {formatNumber(stats.avgArea, { maximumFractionDigits: 1 })} m²
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ø €/m²</span>
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">% befristet</span>
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
        <div className="mt-1 text-sm text-muted-foreground">
          {metric === "limitedPercentage" &&
            `${Math.round(heatmapValue)}% befristet`}
          {metric === "avgPricePerSqm" && `${Math.round(heatmapValue)} €/m²`}
          {metric === "totalListings" && `${Math.round(heatmapValue)} Inserate`}
        </div>
      )}
      {buttons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className="w-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors text-left"
            >
              {button.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
