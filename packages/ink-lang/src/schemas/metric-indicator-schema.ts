import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/MetricIndicator/schema.ts.
export const MetricIndicatorTrendSchema = z.object({
  direction: z.enum(["up", "down"]),
  value: z.number(),
});

export const MetricIndicatorWithStrikethroughSchema = z.object({
  value: z.string(),
  subtext: z.string().optional(),
  previousValue: z.string().optional(),
  trend: MetricIndicatorTrendSchema.optional(),
});

export const MetricIndicatorInlineSchema = z.object({
  value: z.string(),
  subtext: z.string().optional(),
  trend: MetricIndicatorTrendSchema.optional(),
});
