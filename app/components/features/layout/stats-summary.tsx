import * as React from "react";
import { useMatches } from "react-router";

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

  const items = [
    { label: "Inserate gesamt", value: formatNumber(stats.total) },
    { label: "Aktiv", value: formatNumber(stats.activeCount) },
    {
      label: "Ø Preis",
      value: `${formatNumber(stats.avgPrice, { maximumFractionDigits: 0 })} €`,
    },
    {
      label: "Ø Fläche",
      value: `${formatNumber(stats.avgArea, { maximumFractionDigits: 1 })} m²`,
    },
    {
      label: "Ø €/m²",
      value: `${formatNumber(stats.avgPricePerSqm, {
        maximumFractionDigits: 1,
      })} €/m²`,
    },
    {
      label: "% befristet",
      value:
        stats.limitedPct == null
          ? "-"
          : `${formatNumber(stats.limitedPct, { maximumFractionDigits: 1 })}%`,
    },
  ];

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-2 text-xs">
          {items.map((it) => (
            <div key={it.label} className="flex flex-col">
              <div className="text-muted-foreground">{it.label}</div>
              <div className="font-medium">{it.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
