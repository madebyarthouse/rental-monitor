import * as React from "react";
import type { StatisticsSummary } from "@/services/statistics-service";

function formatNumber(
  n: number | null | undefined,
  opts?: Intl.NumberFormatOptions
): string {
  if (n == null || !Number.isFinite(n as number)) return "-";
  return new Intl.NumberFormat("de-AT", opts).format(n as number);
}

type GroupedStat = {
  slug: string;
  name: string;
  stats: StatisticsSummary;
};

export function StatisticsTable({
  groupedStats,
  className,
}: {
  groupedStats: GroupedStat[];
  className?: string;
}) {
  const [sortBy, setSortBy] = React.useState<keyof StatisticsSummary | null>(
    null
  );
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "desc"
  );

  const sortedStats = React.useMemo(() => {
    if (!sortBy) return groupedStats;
    const sorted = [...groupedStats].sort((a, b) => {
      const aVal = a.stats[sortBy];
      const bVal = b.stats[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return (aVal as number) - (bVal as number);
    });
    return sortDirection === "desc" ? sorted.reverse() : sorted;
  }, [groupedStats, sortBy, sortDirection]);

  const handleSort = (key: keyof StatisticsSummary) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDirection("desc");
    }
  };

  return (
    <div className={className}>
      <div className="border-t md:border-l-0 border-l border-r border-black">
        <div className="border-b border-black p-4 md:p-8">
          <div className="mb-2 text-base font-medium">Regionen im Vergleich</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                  Name
                </th>
                <th
                  className="text-right py-2 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("total")}
                >
                  Inserate gesamt
                  {sortBy === "total" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="text-right py-2 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("avgPrice")}
                >
                  Ø Preis
                  {sortBy === "avgPrice" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="text-right py-2 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("avgArea")}
                >
                  Ø Fläche
                  {sortBy === "avgArea" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="text-right py-2 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("avgPricePerSqm")}
                >
                  Ø €/m²
                  {sortBy === "avgPricePerSqm" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="text-right py-2 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("limitedPct")}
                >
                  % befristet
                  {sortBy === "limitedPct" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat) => (
                <tr
                  key={stat.slug}
                  className="border-b border-border/50 hover:bg-muted/50"
                >
                  <td className="py-2 px-2 font-medium">{stat.name}</td>
                  <td className="py-2 px-2 text-right">
                    {formatNumber(stat.stats.total)}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {formatNumber(stat.stats.avgPrice, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    €
                  </td>
                  <td className="py-2 px-2 text-right">
                    {formatNumber(stat.stats.avgArea, {
                      maximumFractionDigits: 1,
                    })}{" "}
                    m²
                  </td>
                  <td className="py-2 px-2 text-right">
                    {formatNumber(stat.stats.avgPricePerSqm, {
                      maximumFractionDigits: 1,
                    })}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {stat.stats.limitedPct == null
                      ? "-"
                      : `${formatNumber(stat.stats.limitedPct, {
                          maximumFractionDigits: 1,
                        })}%`}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
