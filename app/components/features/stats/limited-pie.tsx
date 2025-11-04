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
          innerRadius={0}
          outerRadius="95%"
          paddingAngle={0}
        >
          {data.map((entry) => (
            <Cell
              key={entry.key}
              fill={`var(--color-${entry.key})`}
              stroke={"hsl(var(--background))"}
              strokeWidth={1}
            />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} />
      </PieChart>
    </ChartContainer>
  );
}
