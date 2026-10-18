import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { HorizontalBarChartSchema } from "../schemas/horizontal-bar-chart-schema";
import { SeriesBars } from "./series-bars";

type HorizontalBarChartProps = z.infer<typeof HorizontalBarChartSchema>;

function HorizontalBarChartRenderer({ props }: ComponentRenderProps<HorizontalBarChartProps>) {
  return (
    <SeriesBars
      labels={props.labels}
      series={props.series}
      xLabel={props.xLabel}
      yLabel={props.yLabel}
    />
  );
}

export const HorizontalBarChart = defineComponent({
  name: "HorizontalBarChart",
  props: HorizontalBarChartSchema,
  description: "Horizontal bars; prefer when category labels are long or for ranked lists",
  component: HorizontalBarChartRenderer,
});
