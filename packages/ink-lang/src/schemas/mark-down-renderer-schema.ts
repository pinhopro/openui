import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/MarkDownRenderer/schema.ts.
export const MarkDownRendererSchema = z.object({
  textMarkdown: z.string(),
  variant: z.enum(["clear", "card", "sunk"]).optional(),
});
