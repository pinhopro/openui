import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/RadioGroup/schema.ts.
export const RadioItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  value: z.string(),
});
