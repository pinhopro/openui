import { z } from "zod/v4";
import { ScatterSeriesSchema } from "./scatter-series-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/ScatterChart.ts (ScatterChartSchema).
export const ScatterChartSchema = z.object({
  datasets: z.array(ScatterSeriesSchema),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});
