import { z } from "zod/v4";
import { SeriesSchema } from "./series-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/RadarChart.ts (RadarChartSchema).
export const RadarChartSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
});
