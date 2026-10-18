import { z } from "zod/v4";

// Verbatim copy of SelectItemSchema in packages/react-ui/src/genui-lib/Select/schema.ts.
export const SelectItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});
