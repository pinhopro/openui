import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { LineChartSchema } from "../schemas/line-chart-schema";
import { BrailleSeriesChart } from "./braille-series-chart";

type LineChartProps = z.infer<typeof LineChartSchema>;

function LineChartRenderer({ props }: ComponentRenderProps<LineChartProps>) {
  return (
    <BrailleSeriesChart
      labels={props.labels}
      series={props.series}
      xLabel={props.xLabel}
      yLabel={props.yLabel}
      filled={false}
    />
  );
}

export const LineChart = defineComponent({
  name: "LineChart",
  props: LineChartSchema,
  description: "Lines over categories; use for trends and continuous data over time",
  component: LineChartRenderer,
});
