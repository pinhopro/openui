import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/SingleStackedBarChart.ts.
export const SingleStackedBarChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});
