import { z } from "zod/v4";
import { Tag } from "../components/tag";

// Verbatim copy of ContextCardItemSchema in packages/react-ui/src/genui-lib/ContextCardBlock/schema.ts.
const contextCardBgColorSchema = z.enum(["gray"]);

export const ContextCardItemSchema = z.object({
  id: z.string().optional(),
  title: z.union([z.string(), Tag.ref]),
  body: z.string().optional(),
  bgColor: contextCardBgColorSchema.optional(),
  bgImageSrc: z.string().optional(),
  bgImageAlt: z.string().optional(),
});
