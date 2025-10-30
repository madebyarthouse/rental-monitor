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
    { label: "Aktiv", value: formatNumber(stats.activeCount), Icon: CheckCircle2 },
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
      value: `${formatNumber(stats.avgPricePerSqm, { maximumFractionDigits: 1 })} €/m²`,
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

  function renderRow() {
    return (
      <div className="flex divide-x divide-border overflow-x-auto">
        {items.map(({ label, value, Icon }) => (
          <div key={label} className="px-4 py-3 min-w-40">
            <div className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              <div className="font-semibold text-lg sm:text-xl">{value}</div>
            </div>
            <div className="text-muted-foreground text-sm">{label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="py-2">
          {renderRow()}
        </div>
      </div>
    </div>
  );
}
