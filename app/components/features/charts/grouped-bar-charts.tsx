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
import { chartColors } from "@/lib/theme-colors";

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
      <div className="grid border-t border-l border-r border-black grid-cols-1 xl:grid-cols-2">
        {/* Stacked bar chart: Limited/Unlimited */}
        <div className="border-b border-black xl:border-r p-4 md:p-8">
          <div className="mb-2 text-base font-medium">
            % Befristet/Unbefristet
          </div>
          <ChartContainer
            config={{
              limited: {
                label: "Befristet",
                color: chartColors.limited,
              },
              unlimited: {
                label: "Unbefristet",
                color: chartColors.unlimited,
              },
            }}
          >
            <BarChart data={limitedData} layout="vertical" barSize={50} barCategoryGap="5%">
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
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 14 }}
                interval={0}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="limited"
                stackId="a"
                fill={chartColors.limited}
              />
              <Bar
                dataKey="unlimited"
                stackId="a"
                fill={chartColors.unlimited}
              />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Bar chart: Price per sqm */}
        <div className="border-b border-black p-4 md:p-8">
          <div className="mb-2 text-base font-medium">Ø €/m²</div>
          <ChartContainer
            config={{
              value: { label: "Ø €/m²", color: chartColors.price },
            }}
          >
            <BarChart data={pricePerSqmData} layout="vertical" barSize={50} barCategoryGap="5%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 14 }}
                interval={0}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="value" fill={chartColors.price} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Bar chart: Number of units */}
        <div className="border-b border-black xl:border-r p-4 md:p-8">
          <div className="mb-2 text-base font-medium">Anzahl Inserate</div>
          <ChartContainer
            config={{
              value: { label: "Anzahl", color: chartColors.tertiary },
            }}
          >
            <BarChart data={unitsData} layout="vertical" barSize={50} barCategoryGap="5%">
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
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 14 }}
                interval={0}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="value" fill={chartColors.tertiary} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
