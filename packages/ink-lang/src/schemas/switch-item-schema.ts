import { z } from "zod/v4";

// Verbatim copy of SwitchItemSchema in packages/react-ui/src/genui-lib/SwitchGroup/schema.ts.
export const SwitchItemSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  name: z.string(),
  defaultChecked: z.boolean().optional(),
});
