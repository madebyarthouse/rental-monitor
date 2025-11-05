import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { chartColors } from "@/lib/theme-colors";

type Bucket = { start: number; end: number | null; limited: number; unlimited: number };

function formatCurrencyShort(value: number): string {
  if (!Number.isFinite(value)) return "-";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} Mio`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(Math.round(value));
}

export function DualPriceHistogram({
  buckets,
  className,
}: {
  buckets: Bucket[];
  className?: string;
}) {
  const data = React.useMemo(() => {
    return buckets.map((b, i) => {
      const label =
        b.end == null
          ? `${formatCurrencyShort(b.start)}+`
          : `${formatCurrencyShort(b.start)}–${formatCurrencyShort(b.end)}`;
      return { key: i, label, limited: b.limited, unlimited: b.unlimited };
    });
  }, [buckets]);

  return (
    <ChartContainer
      className={className}
      config={{
        limited: { label: "Befristet", color: chartColors.limited },
        unlimited: { label: "Unbefristet", color: chartColors.unlimited },
      }}
    >
      <BarChart data={data} barCategoryGap={8} barSize={26}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={0}
          minTickGap={8}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="limited" fill={chartColors.limited} />
        <Bar dataKey="unlimited" fill={chartColors.unlimited} />
      </BarChart>
    </ChartContainer>
  );
}


