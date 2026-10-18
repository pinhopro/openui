import { z } from "zod/v4";
import { VisualCardItem } from "../components/visual-card-item";
import { actionPropSchema } from "./action-schema";

// Verbatim copy of VisualCardBlockSchema in packages/react-ui/src/genui-lib/VisualCardBlock/schema.ts.
export const VisualCardBlockSchema = z.object({
  items: z.array(VisualCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});
