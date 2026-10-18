import { z } from "zod/v4";
import { BoldText } from "../components/bold-text";
import { IconText } from "../components/icon-text";
import { ImageText } from "../components/image-text";
import { Text } from "../components/text";

// Verbatim copy of SnippetCardItemSchema in packages/react-ui/src/genui-lib/SnippetCardBlock/schema.ts.
export const SnippetCardItemSchema = z.object({
  id: z.string().optional(),
  lhs: z.union([IconText.ref, ImageText.ref]),
  rhs: z.union([Text.ref, BoldText.ref]).optional(),
});
