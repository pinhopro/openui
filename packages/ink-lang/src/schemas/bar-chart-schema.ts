import { z } from "zod/v4";
import { SeriesSchema } from "./series-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/BarChartCondensed.ts (BarChartCondensedSchema).
export const BarChartSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().optional(),
});
