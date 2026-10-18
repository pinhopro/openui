import { z } from "zod/v4";
import { SnippetCardItem } from "../components/snippet-card-item";
import { actionPropSchema } from "./action-schema";

// Verbatim copy of SnippetCardBlockSchema in packages/react-ui/src/genui-lib/SnippetCardBlock/schema.ts.
export const SnippetCardBlockSchema = z.object({
  items: z.array(SnippetCardItem.ref).min(2),
  layout: z.enum(["grid"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});
