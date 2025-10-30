import * as React from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { chartColors } from "@/lib/theme-colors";

export function LimitedPie({
  limited,
  unlimited,
  className,
}: {
  limited: number;
  unlimited: number;
  className?: string;
}) {
  const data = React.useMemo(
    () => [
      {
        key: "limited",
        label: "Befristet",
        value: limited,
        fill: "var(--color-limited)",
      },
      {
        key: "unlimited",
        label: "Unbefristet",
        value: unlimited,
        fill: "var(--color-unlimited)",
      },
    ],
    [limited, unlimited]
  );

  return (
    <ChartContainer
      className={className}
      config={{
        limited: { label: "Befristet", color: chartColors.limited },
        unlimited: { label: "Unbefristet", color: chartColors.unlimited },
      }}
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  );
}
