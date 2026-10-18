import { z } from "zod/v4";
import { SeriesSchema } from "./series-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/HorizontalBarChart.ts (HorizontalBarChartSchema).
export const HorizontalBarChartSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});
