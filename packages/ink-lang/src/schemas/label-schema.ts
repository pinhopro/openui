import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Label/schema.ts.
export const LabelSchema = z.object({
  text: z.string(),
});
