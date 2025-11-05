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

type GroupedLimitedPremium = Array<{
  slug: string;
  name: string;
  premiumPct: number | null;
  limitedAvgPricePerSqm: number | null;
  unlimitedAvgPricePerSqm: number | null;
}>;

export function LimitedPremiumByRegion({
  data,
  activeSlug,
  className,
}: {
  data: GroupedLimitedPremium;
  activeSlug?: string;
  className?: string;
}) {
  const sorted = React.useMemo(() => {
    return [...data]
      .map((d) => ({
        slug: d.slug,
        name: d.name,
        premiumPct: d.premiumPct ?? 0,
      }))
      .sort((a, b) => (b.premiumPct ?? 0) - (a.premiumPct ?? 0));
  }, [data]);

  return (
    <ChartContainer
      className={className}
      config={{ premiumPct: { label: "Preisaufschlag Befristung (%)", color: chartColors.priceHighlight } }}
    >
      <BarChart data={sorted} layout="vertical" barSize={46} barCategoryGap="6%">
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
        <Bar dataKey="premiumPct" fill={chartColors.priceHighlight}>
          {sorted.map((d) => (
            <Cell
              key={d.slug}
              fill={chartColors.priceHighlight}
              fillOpacity={activeSlug ? (d.slug === activeSlug ? 1 : 0.4) : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}


