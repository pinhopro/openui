import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/RadialChart.ts (RadialChartSchema).
export const RadialChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});
