import { z } from "zod/v4";
import { BoldText } from "../components/bold-text";
import { Tag } from "../components/tag";

// Verbatim copy of VisualCardItemSchema in packages/react-ui/src/genui-lib/VisualCardBlock/schema.ts.
export const VisualCardItemSchema = z.object({
  body: BoldText.ref,
  id: z.string().optional(),
  bgImageSrc: z.string().optional(),
  tag: z.optional(Tag.ref),
  bgImageAlt: z.string().optional(),
});
