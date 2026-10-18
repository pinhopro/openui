import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { RadarChartSchema } from "../schemas/radar-chart-schema";
import { SeriesBars } from "./series-bars";

type RadarChartProps = z.infer<typeof RadarChartSchema>;

/** A radar chart has no terminal shape; its variables read as bars per series. */
function RadarChartRenderer({ props }: ComponentRenderProps<RadarChartProps>) {
  return (
    <SeriesBars labels={props.labels} series={props.series} xLabel={undefined} yLabel={undefined} />
  );
}

export const RadarChart = defineComponent({
  name: "RadarChart",
  props: RadarChartSchema,
  description: "Spider/web chart; use for comparing multiple variables across one or more entities",
  component: RadarChartRenderer,
});
