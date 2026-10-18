import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { RadialChartSchema } from "../schemas/radial-chart-schema";
import { ProportionChart } from "./proportion-chart";

type RadialChartProps = z.infer<typeof RadialChartSchema>;

function RadialChartRenderer({ props }: ComponentRenderProps<RadialChartProps>) {
  return <ProportionChart labels={props.labels} values={props.values} />;
}

export const RadialChart = defineComponent({
  name: "RadialChart",
  props: RadialChartSchema,
  description: "Radial bars; use plucked arrays: RadialChart(data.categories, data.values)",
  component: RadialChartRenderer,
});
