import { z } from "zod/v4";
import { ContextCardItem } from "../components/context-card-item";
import { actionPropSchema } from "./action-schema";

// Verbatim copy of ContextCardBlockSchema in packages/react-ui/src/genui-lib/ContextCardBlock/schema.ts.
export const ContextCardBlockSchema = z.object({
  items: z.array(ContextCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});
