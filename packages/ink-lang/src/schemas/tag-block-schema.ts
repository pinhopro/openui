import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/TagBlock/schema.ts.
export const TagBlockSchema = z.object({
  tags: z.array(z.string()),
  size: z.enum(["sm", "md", "lg"]).optional(),
});
