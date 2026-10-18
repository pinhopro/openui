import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/Slice.ts (SliceSchema).
export const SliceSchema = z.object({
  category: z.string(),
  value: z.number(),
});
