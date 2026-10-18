import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { BarChartSchema } from "../schemas/bar-chart-schema";
import { SeriesBars } from "./series-bars";

type BarChartProps = z.infer<typeof BarChartSchema>;

function BarChartRenderer({ props }: ComponentRenderProps<BarChartProps>) {
  return (
    <SeriesBars
      labels={props.labels}
      series={props.series}
      xLabel={props.xLabel}
      yLabel={props.yLabel}
    />
  );
}

export const BarChart = defineComponent({
  name: "BarChart",
  props: BarChartSchema,
  description: "Vertical bars; use for comparing values across categories with one or more series",
  component: BarChartRenderer,
});
