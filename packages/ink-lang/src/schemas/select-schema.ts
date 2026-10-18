import { z } from "zod/v4";
import { SelectItem } from "../components/select-item";
import { reactive } from "../reactive";
import { rulesSchema } from "./rules-schema";

type RefComponent = { ref: any };

// Verbatim copy of createSelectSchema in packages/react-ui/src/genui-lib/Select/schema.ts.
export function createSelectSchema(SelectItem: RefComponent) {
  return z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
    rules: rulesSchema,
    value: reactive(z.string().optional()),
    size: z.enum(["small", "medium", "large"]).optional(),
  });
}

export const SelectSchema = createSelectSchema(SelectItem);
