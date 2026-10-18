import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { SingleStackedBarChartSchema } from "../schemas/single-stacked-bar-chart-schema";
import { ProportionChart } from "./proportion-chart";

type SingleStackedBarChartProps = z.infer<typeof SingleStackedBarChartSchema>;

function SingleStackedBarChartRenderer({
  props,
}: ComponentRenderProps<SingleStackedBarChartProps>) {
  return <ProportionChart labels={props.labels} values={props.values} />;
}

export const SingleStackedBarChart = defineComponent({
  name: "SingleStackedBarChart",
  props: SingleStackedBarChartSchema,
  description:
    "Single horizontal stacked bar; use plucked arrays: SingleStackedBarChart(data.categories, data.values)",
  component: SingleStackedBarChartRenderer,
});
