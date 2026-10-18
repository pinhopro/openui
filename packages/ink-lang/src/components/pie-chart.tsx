import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { PieChartSchema } from "../schemas/pie-chart-schema";
import { ProportionChart } from "./proportion-chart";

type PieChartProps = z.infer<typeof PieChartSchema>;

function PieChartRenderer({ props }: ComponentRenderProps<PieChartProps>) {
  return <ProportionChart labels={props.labels} values={props.values} />;
}

export const PieChart = defineComponent({
  name: "PieChart",
  props: PieChartSchema,
  description: "Circular slices; use plucked arrays: PieChart(data.categories, data.values)",
  component: PieChartRenderer,
});
