import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/ImageBlock/schema.ts.
export const ImageBlockSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
});
