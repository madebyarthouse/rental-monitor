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
} from "@/components/ui/chart";

type Bucket = { start: number; end: number | null; count: number };

function formatCurrencyShort(value: number): string {
  if (!Number.isFinite(value)) return "-";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} Mio`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(Math.round(value));
}

export function PriceHistogram({
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
      return { key: i, label, count: b.count };
    });
  }, [buckets]);

  return (
    <ChartContainer
      className={className}
      config={{ count: { label: "Anzahl", color: "hsl(var(--chart-1))" } }}
    >
      <BarChart data={data} barSize={18}>
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
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
