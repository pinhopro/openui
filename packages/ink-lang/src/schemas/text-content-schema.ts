import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/TextContent/schema.ts.
export const TextContentSchema = z.object({
  text: z.string(),
  size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
});
