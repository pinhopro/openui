import { z } from "zod/v4";
import { CompositeCardItem } from "../components/composite-card-item";
import { actionPropSchema } from "./action-schema";

// Verbatim copy of CompositeCardBlockSchema in packages/react-ui/src/genui-lib/CompositeCardBlock/schema.ts.
export const CompositeCardBlockSchema = z.object({
  items: z.array(CompositeCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});
