import { z } from "zod/v4";
import { Icon } from "../components/icon";

// Verbatim copy of ChipItemSchema in packages/react-ui/src/genui-lib/Chips/schema.ts.
export const ChipItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  icon: z.optional(Icon.ref),
  disabled: z.boolean().optional(),
});
