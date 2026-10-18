import { z } from "zod/v4";
import { OverviewCardItem } from "../components/overview-card-item";
import { actionPropSchema } from "./action-schema";

// Verbatim copy of OverviewCardBlockSchema in packages/react-ui/src/genui-lib/OverviewCardBlock/schema.ts.
export const OverviewCardBlockSchema = z.object({
  items: z.array(OverviewCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});
