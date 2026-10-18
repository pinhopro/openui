import { z } from "zod/v4";
import { reactive } from "../reactive";
import { rulesSchema } from "./rules-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Slider/schema.ts.
export const SliderSchema = z.object({
  name: z.string(),
  variant: z.enum(["continuous", "discrete"]),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  defaultValue: z.array(z.number()).optional(),
  label: z.string().optional(),
  rules: rulesSchema,
  value: reactive(z.array(z.number()).optional()),
});
