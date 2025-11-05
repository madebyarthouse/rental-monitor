import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
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
import { LimitedVsUnlimitedByRegion } from "./limited-vs-unlimited-by-region";

type GroupedStat = {
  slug: string;
  name: string;
  stats: StatisticsSummary;
};

function orderBySlug<T>(
  items: T[],
  getSlug: (item: T) => string,
  order?: string[]
): T[] {
  if (!order || order.length === 0) return items;
  const indexBySlug = new Map(order.map((slug, idx) => [slug, idx]));
  return [...items].sort((a, b) => {
    const ai = indexBySlug.get(getSlug(a));
    const bi = indexBySlug.get(getSlug(b));
    if (ai == null && bi == null) return 0;
    if (ai == null) return 1;
    if (bi == null) return -1;
    return ai - bi;
  });
}

export function GroupedBarCharts({
  groupedStats,
  className,
  activeSlug,
  groupedLimitedPremium,
  sortOrder,
}: {
  groupedStats: GroupedStat[];
  className?: string;
  activeSlug?: string;
  groupedLimitedPremium?: Array<{
    slug: string;
    name: string;
    premiumPct: number | null;
    limitedAvgPricePerSqm: number | null;
    unlimitedAvgPricePerSqm: number | null;
  }>;
  sortOrder?: string[];
}) {
  // Prefer explicit order from parent; fallback to total desc
  const sortedStats = React.useMemo(() => {
    if (sortOrder && sortOrder.length > 0) {
      return orderBySlug(groupedStats, (g) => g.slug, sortOrder);
    }
    return [...groupedStats].sort((a, b) => b.stats.total - a.stats.total);
  }, [groupedStats, sortOrder]);

  // Stacked bar chart data for limited/unlimited percentage
  const limitedData = React.useMemo(() => {
    return sortedStats.map((stat) => {
      const total = stat.stats.total;
      const limited = stat.stats.limitedCount;
      const unlimited = total - limited;
      const limitedPct = total > 0 ? (limited / total) * 100 : 0;
      const unlimitedPct = total > 0 ? (unlimited / total) * 100 : 0;
      return {
        slug: stat.slug,
        name: stat.name,
        limited: limitedPct,
        unlimited: unlimitedPct,
      };
    });
  }, [sortedStats]);

  // Keep parent-defined order if provided; else sort by limited desc
  const limitedDataSorted = React.useMemo(() => {
    if (sortOrder && sortOrder.length > 0) return limitedData;
    return [...limitedData].sort((a, b) => b.limited - a.limited);
  }, [limitedData, sortOrder]);

  // Price per sqm data
  const pricePerSqmData = React.useMemo(() => {
    return sortedStats.map((stat) => ({
      slug: stat.slug,
      name: stat.name,
      value: stat.stats.avgPricePerSqm ?? 0,
    }));
  }, [sortedStats]);

  // Number of units data
  const unitsData = React.useMemo(() => {
    return sortedStats.map((stat) => ({
      slug: stat.slug,
      name: stat.name,
      value: stat.stats.total,
    }));
  }, [sortedStats]);

  const idealHeight = unitsData.length * 35 + 100;
  const height = Math.max(idealHeight, 450);

  return (
    <div className={className}>
      <div className="grid border-t  border-black grid-cols-1 xl:grid-cols-2">
        {/* Stacked bar chart: Limited/Unlimited */}
        <div className="border-b border-black xl:border-r p-4 md:p-8">
          <div className="mb-2 text-base font-medium">
            % Befristet/Unbefristet
          </div>
          <ChartContainer
            style={{
              height,
            }}
            className="w-full"
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
            <BarChart
              data={limitedDataSorted}
              layout="vertical"
              barSize={50}
              barCategoryGap="10%"
            >
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
              <Bar dataKey="limited" stackId="a" fill={chartColors.limited}>
                {limitedDataSorted.map((d) => (
                  <Cell
                    key={`limited-${d.slug}`}
                    fill={chartColors.limited}
                    fillOpacity={
                      activeSlug ? (d.slug === activeSlug ? 1 : 0.75) : 1
                    }
                  />
                ))}
              </Bar>
              <Bar dataKey="unlimited" stackId="a" fill={chartColors.unlimited}>
                {limitedDataSorted.map((d) => (
                  <Cell
                    key={`unlimited-${d.slug}`}
                    fill={chartColors.unlimited}
                    fillOpacity={
                      activeSlug ? (d.slug === activeSlug ? 1 : 0.75) : 1
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {groupedLimitedPremium && groupedLimitedPremium.length > 0 && (
          <div className="border-b border-black p-4 md:p-8">
            <div className="mb-2 text-base font-medium">
              Ø €/m² nach Befristung
            </div>
            <LimitedVsUnlimitedByRegion
              style={{
                height,
              }}
              className="w-full"
              data={orderBySlug(
                groupedLimitedPremium,
                (g) => g.slug,
                sortOrder
              ).map((g) => ({
                slug: g.slug,
                name: g.name,
                limitedAvgPricePerSqm: g.limitedAvgPricePerSqm,
                unlimitedAvgPricePerSqm: g.unlimitedAvgPricePerSqm,
              }))}
              preserveOrder
              activeSlug={activeSlug}
            />
          </div>
        )}

        {/* Bar chart: Price per sqm */}
        <div className="border-b border-black xl:border-r p-4 md:p-8">
          <div className="mb-2 text-base font-medium">
            Durchschnittliche Miete €/m²
          </div>
          <ChartContainer
            style={{
              height,
            }}
            className="w-full"
            config={{
              value: { label: "Ø €/m²", color: chartColors.price },
            }}
          >
            <BarChart
              data={pricePerSqmData}
              layout="vertical"
              barSize={50}
              barCategoryGap="10%"
            >
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
              <Bar dataKey="value" fill={chartColors.price}>
                {pricePerSqmData.map((d) => (
                  <Cell
                    key={`price-${d.slug}`}
                    fill={chartColors.price}
                    fillOpacity={
                      activeSlug ? (d.slug === activeSlug ? 1 : 0.75) : 1
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Bar chart: Number of units */}
        <div className="border-b border-black p-4 md:p-8">
          <div className="mb-2 text-base font-medium">Anzahl Inserate</div>
          <ChartContainer
            style={{
              height,
            }}
            className="w-full"
            config={{
              value: { label: "Anzahl", color: chartColors.tertiary },
            }}
          >
            <BarChart
              data={unitsData}
              layout="vertical"
              barSize={50}
              barCategoryGap="10%"
            >
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
              <Bar dataKey="value" fill={chartColors.tertiary}>
                {unitsData.map((d) => (
                  <Cell
                    key={`units-${d.slug}`}
                    fill={chartColors.tertiary}
                    fillOpacity={
                      activeSlug ? (d.slug === activeSlug ? 1 : 0.75) : 1
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
