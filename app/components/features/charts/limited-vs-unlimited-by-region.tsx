import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { chartColors } from "@/lib/theme-colors";

type RegionAvg = {
  slug: string;
  name: string;
  limitedAvgPricePerSqm: number | null;
  unlimitedAvgPricePerSqm: number | null;
};

export function LimitedVsUnlimitedByRegion({
  data,
  activeSlug,
  className,
  preserveOrder,
}: {
  data: RegionAvg[];
  activeSlug?: string;
  className?: string;
  preserveOrder?: boolean;
}) {
  const chartData = React.useMemo(() => {
    const mapped = [...data].map((d) => ({
      slug: d.slug,
      name: d.name,
      limited: d.limitedAvgPricePerSqm ?? 0,
      unlimited: d.unlimitedAvgPricePerSqm ?? 0,
    }));
    if (preserveOrder) return mapped;
    // sort by higher of the two to bring larger bars to top
    return mapped.sort(
      (a, b) => Math.max(b.limited, b.unlimited) - Math.max(a.limited, a.unlimited)
    );
  }, [data, preserveOrder]);

  return (
    <ChartContainer
      className={className}
      config={{
        limited: { label: "Befristet", color: chartColors.limited },
        unlimited: { label: "Unbefristet", color: chartColors.unlimited },
      }}
    >
      <BarChart data={chartData} layout="vertical" barSize={40} barCategoryGap="10%">
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
        <Bar dataKey="limited" fill={chartColors.limited}>
          {chartData.map((d) => (
            <Cell
              key={`limited-${d.slug}`}
              fill={chartColors.limited}
              fillOpacity={activeSlug ? (d.slug === activeSlug ? 1 : 0.7) : 1}
            />
          ))}
        </Bar>
        <Bar dataKey="unlimited" fill={chartColors.unlimited}>
          {chartData.map((d) => (
            <Cell
              key={`unlimited-${d.slug}`}
              fill={chartColors.unlimited}
              fillOpacity={activeSlug ? (d.slug === activeSlug ? 1 : 0.7) : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}


