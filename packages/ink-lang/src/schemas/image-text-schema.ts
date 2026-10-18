import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/ImageText/schema.ts.
export const ImageTextSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  bold: z.boolean().default(false),
  layout: z.enum(["horizontal", "vertical"]).default("horizontal"),
  imageSize: z.number().optional(),
});
