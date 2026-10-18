import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/BoldText/schema.ts.
export const BoldTextSchema = z.object({
  variant: z.enum(["text", "number"]).default("text"),
  value: z.string(),
  subtext: z.string().optional(),
  subtextVariant: z.enum(["text", "number", "metric"]).default("text"),
  size: z.enum(["xs", "sm", "md", "lg"]).default("sm"),
});
