import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Steps/schema.ts.
export const StepsItemSchema = z.object({
  title: z.string(),
  details: z.string(),
});
