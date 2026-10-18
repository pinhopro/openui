import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Separator/schema.ts.
export const SeparatorSchema = z.object({
  orientation: z.enum(["horizontal", "vertical"]).optional(),
  decorative: z.boolean().optional(),
});
