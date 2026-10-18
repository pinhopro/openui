import { z } from "zod/v4";
import { SeriesSchema } from "./series-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/AreaChartCondensed.ts (AreaChartCondensedSchema).
export const AreaChartSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["linear", "natural", "step"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().optional(),
});
