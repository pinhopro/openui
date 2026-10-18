import { z } from "zod/v4";
import { OptionCard } from "../components/option-card";
import { rulesSchema } from "./rules-schema";

// Verbatim copy of OptionCardsSchema in packages/react-ui/src/genui-lib/OptionCards/schema.ts.
export const OptionCardsSchema = z.object({
  name: z.string(),
  type: z.enum(["single", "multiple"]).default("single"),
  items: z.array(OptionCard.ref).default([]),
  rules: rulesSchema,
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
});
