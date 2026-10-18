import { z } from "zod/v4";

// Verbatim copy of CheckBoxItemSchema in packages/react-ui/src/genui-lib/CheckBoxGroup/schema.ts.
export const CheckBoxItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  name: z.string(),
  defaultChecked: z.boolean().optional(),
});
