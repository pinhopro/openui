import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/ImageTextLarge/schema.ts.
export const ImageTextLargeSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  bold: z.boolean().default(false),
});
