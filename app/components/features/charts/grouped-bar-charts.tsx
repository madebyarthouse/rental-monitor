import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { StatisticsSummary } from "@/services/statistics-service";

type GroupedStat = {
  slug: string;
  name: string;
  stats: StatisticsSummary;
};

export function GroupedBarCharts({
  groupedStats,
  className,
}: {
  groupedStats: GroupedStat[];
  className?: string;
}) {
  // Sort by total descending for better readability
  const sortedStats = React.useMemo(() => {
    return [...groupedStats].sort((a, b) => b.stats.total - a.stats.total);
  }, [groupedStats]);

  // Stacked bar chart data for limited/unlimited percentage
  const limitedData = React.useMemo(() => {
    return sortedStats.map((stat) => {
      const total = stat.stats.total;
      const limited = stat.stats.limitedCount;
      const unlimited = total - limited;
      const limitedPct = total > 0 ? (limited / total) * 100 : 0;
      const unlimitedPct = total > 0 ? (unlimited / total) * 100 : 0;
      return {
        name: stat.name,
        limited: limitedPct,
        unlimited: unlimitedPct,
      };
    });
  }, [sortedStats]);

  // Price per sqm data
  const pricePerSqmData = React.useMemo(() => {
    return sortedStats.map((stat) => ({
      name: stat.name,
      value: stat.stats.avgPricePerSqm ?? 0,
    }));
  }, [sortedStats]);

  // Number of units data
  const unitsData = React.useMemo(() => {
    return sortedStats.map((stat) => ({
      name: stat.name,
      value: stat.stats.total,
    }));
  }, [sortedStats]);

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-3">
        {/* Stacked bar chart: Limited/Unlimited */}
        <div className="rounded-md border p-3">
          <div className="mb-2 text-sm font-medium">
            % Befristet/Unbefristet
          </div>
          <ChartContainer
            config={{
              limited: {
                label: "Befristet",
                color: "hsl(var(--chart-2))",
              },
              unlimited: {
                label: "Unbefristet",
                color: "hsl(var(--chart-3))",
              },
            }}
          >
            <BarChart data={limitedData} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="limited"
                stackId="a"
                fill="var(--color-limited)"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="unlimited"
                stackId="a"
                fill="var(--color-unlimited)"
                radius={[4, 0, 0, 4]}
              />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Bar chart: Price per sqm */}
        <div className="rounded-md border p-3">
          <div className="mb-2 text-sm font-medium">Ø €/m²</div>
          <ChartContainer
            config={{
              value: { label: "Ø €/m²", color: "hsl(var(--chart-1))" },
            }}
          >
            <BarChart data={pricePerSqmData} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Bar chart: Number of units */}
        <div className="rounded-md border p-3">
          <div className="mb-2 text-sm font-medium">Anzahl Inserate</div>
          <ChartContainer
            config={{
              value: { label: "Anzahl", color: "hsl(var(--chart-1))" },
            }}
          >
            <BarChart data={unitsData} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
