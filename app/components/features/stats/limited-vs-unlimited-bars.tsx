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

export function LimitedVsUnlimitedBars({
  limitedAvgPricePerSqm,
  unlimitedAvgPricePerSqm,
  className,
}: {
  limitedAvgPricePerSqm: number | null;
  unlimitedAvgPricePerSqm: number | null;
  className?: string;
}) {
  const data = React.useMemo(
    () => [
      { key: "limited", label: "Befristet", value: limitedAvgPricePerSqm ?? 0 },
      { key: "unlimited", label: "Unbefristet", value: unlimitedAvgPricePerSqm ?? 0 },
    ],
    [limitedAvgPricePerSqm, unlimitedAvgPricePerSqm]
  );

  return (
    <ChartContainer
      className={className}
      config={{
        limited: { label: "Befristet", color: chartColors.limited },
        unlimited: { label: "Unbefristet", color: chartColors.unlimited },
      }}
    >
      <BarChart data={data} layout="vertical" barSize={46}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          dataKey="label"
          type="category"
          width={150}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="value">
          {data.map((entry) => (
            <Cell
              key={entry.key}
              fill={entry.key === "limited" ? chartColors.limited : chartColors.unlimited}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}


