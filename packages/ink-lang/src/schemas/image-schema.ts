import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Image/schema.ts.
export const ImageSchema = z.object({
  alt: z.string(),
  src: z.string().optional(),
});
