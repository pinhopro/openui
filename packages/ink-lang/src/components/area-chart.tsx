import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { AreaChartSchema } from "../schemas/area-chart-schema";
import { BrailleSeriesChart } from "./braille-series-chart";

type AreaChartProps = z.infer<typeof AreaChartSchema>;

function AreaChartRenderer({ props }: ComponentRenderProps<AreaChartProps>) {
  return (
    <BrailleSeriesChart
      labels={props.labels}
      series={props.series}
      xLabel={props.xLabel}
      yLabel={props.yLabel}
      filled={true}
    />
  );
}

export const AreaChart = defineComponent({
  name: "AreaChart",
  props: AreaChartSchema,
  description: "Filled area under lines; use for cumulative totals or volume trends over time",
  component: AreaChartRenderer,
});
