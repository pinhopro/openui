import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/InlineHeader/schema.ts.
export const InlineHeaderSchema = z.object({
  heading: z.string(),
  description: z.string().optional(),
});
