import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/PieChart.ts (PieChartSchema).
export const PieChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  variant: z.enum(["pie", "donut"]).optional(),
  appearance: z.enum(["circular", "semiCircular"]).optional(),
});
