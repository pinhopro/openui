import { z } from "zod/v4";
import { ChipItem } from "../components/chip-item";
import { rulesSchema } from "./rules-schema";

// Verbatim copy of ChipsSchema in packages/react-ui/src/genui-lib/Chips/schema.ts.
export const ChipsSchema = z.object({
  name: z.string(),
  type: z.enum(["single", "multiple"]).default("multiple"),
  items: z.array(ChipItem.ref).default([]),
  rules: rulesSchema,
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
});
