import { z } from "zod/v4";
import { CheckBoxItem } from "../components/check-box-item";
import { reactive } from "../reactive";
import { rulesSchema } from "./rules-schema";

type RefComponent = { ref: any };

// Verbatim copy of createCheckBoxGroupSchema in packages/react-ui/src/genui-lib/CheckBoxGroup/schema.ts.
export function createCheckBoxGroupSchema(CheckBoxItem: RefComponent) {
  return z.object({
    name: z.string(),
    items: z.array(CheckBoxItem.ref),
    rules: rulesSchema,
    value: reactive(z.record(z.string(), z.boolean()).optional()),
  });
}

export const CheckBoxGroupSchema = createCheckBoxGroupSchema(CheckBoxItem);
