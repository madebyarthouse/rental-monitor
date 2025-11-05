import * as React from "react";
import { useMatches } from "react-router";
import {
  List,
  CheckCircle2,
  Euro,
  Ruler,
  Calculator,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  total: number;
  activeCount: number;
  avgPrice: number | null;
  avgArea: number | null;
  avgPricePerSqm: number | null;
  limitedPct: number | null;
};

function formatNumber(
  n: number | null | undefined,
  opts?: Intl.NumberFormatOptions
) {
  if (n == null || !Number.isFinite(n as number)) return "-";
  return new Intl.NumberFormat("de-AT", opts).format(n as number);
}

export function StatsSummary() {
  const matches = useMatches();
  const stats = React.useMemo<Stats | null>(() => {
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      const data = m.data as unknown;
      if (
        data &&
        typeof data === "object" &&
        "stats" in (data as Record<string, unknown>)
      ) {
        const s = (data as { stats?: Stats }).stats;
        if (s) return s;
      }
    }
    return null;
  }, [matches]);

  if (!stats) return null;

  const items: Array<{ label: string; value: string; Icon: LucideIcon }> = [
    { label: "Inserate gesamt", value: formatNumber(stats.total), Icon: List },
    {
      label: "Ø Preis",
      value: `${formatNumber(stats.avgPrice, { maximumFractionDigits: 0 })} €`,
      Icon: Euro,
    },
    {
      label: "Ø Fläche",
      value: `${formatNumber(stats.avgArea, { maximumFractionDigits: 1 })} m²`,
      Icon: Ruler,
    },
    {
      label: "Ø €/m²",
      value: `${formatNumber(stats.avgPricePerSqm, {
        maximumFractionDigits: 1,
      })} €/m²`,
      Icon: Calculator,
    },
    {
      label: "% befristet",
      value:
        stats.limitedPct == null
          ? "-"
          : `${formatNumber(stats.limitedPct, { maximumFractionDigits: 1 })}%`,
      Icon: Timer,
    },
  ];

  // Split items into two groups of 3 for responsive layout
  const firstRow = items.slice(0, 3);
  const secondRow = items.slice(3);

  function renderRow(rowItems: typeof items, isFirstRow = false) {
    return (
      <div className="flex divide-x divide-black overflow-x-auto">
        <div className="flex-1" />
        {rowItems.map(({ label, value, Icon }, index) => (
          <div
            key={label}
            className={cn(
              "px-4 py-3 min-w-40",
              index === rowItems.length - 1 && "border-r border-black",
              isFirstRow && "border-b border-black"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              <div className="font-semibold text-lg sm:text-xl">{value}</div>
            </div>
            <div className="text-muted-foreground text-sm">{label}</div>
          </div>
        ))}
        <div className="flex-1" />
      </div>
    );
  }

  function renderGridTwoCols() {
    return (
      <div className="grid grid-cols-2">
        {items.map(({ label, value, Icon }, index) => {
          const isLeftCol = index % 2 === 0;
          const isLastRow = index >= items.length - 2; // with 2 columns
          const isPreviousToLastRow = index === items.length - 2;
          return (
            <div
              key={label}
              className={cn(
                "px-4 py-3",
                isLeftCol && "border-r border-black",
                !isLastRow && "border-b border-black",
                isPreviousToLastRow && "border-b border-black"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                <div className="font-semibold text-lg sm:text-xl">{value}</div>
              </div>
              <div className="text-muted-foreground text-sm">{label}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="border-t border-b border-black bg-background">
      <div className="mx-auto max-w-screen-2xl min-[810px]:px-4 px-0">
        {/* Single row above 1400px, two rows below */}
        <div className="hidden min-[1400px]:block">{renderRow(items)}</div>
        <div className="hidden min-[810px]:flex min-[1400px]:hidden flex-col">
          {renderRow(firstRow, true)}
          {renderRow(secondRow)}
        </div>
        <div className="min-[810px]:hidden">{renderGridTwoCols()}</div>
      </div>
    </div>
  );
}
