import { z } from "zod/v4";
import { RadioItem } from "../components/radio-item";
import { reactive } from "../reactive";
import { rulesSchema } from "./rules-schema";

// Verbatim copy of the RadioGroup props in packages/react-ui/src/genui-lib/RadioGroup/index.tsx.
export const RadioGroupSchema = z.object({
  name: z.string(),
  items: z.array(RadioItem.ref),
  defaultValue: z.string().optional(),
  rules: rulesSchema,
  value: reactive(z.string().optional()),
});
