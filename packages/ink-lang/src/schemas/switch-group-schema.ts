import { z } from "zod/v4";
import { SwitchItem } from "../components/switch-item";
import { reactive } from "../reactive";

type RefComponent = { ref: any };

// Verbatim copy of createSwitchGroupSchema in packages/react-ui/src/genui-lib/SwitchGroup/schema.ts.
export function createSwitchGroupSchema(SwitchItem: RefComponent) {
  return z.object({
    name: z.string(),
    items: z.array(SwitchItem.ref),
    variant: z.enum(["clear", "card", "sunk"]).optional(),
    value: reactive(z.record(z.string(), z.boolean()).optional()),
  });
}

export const SwitchGroupSchema = createSwitchGroupSchema(SwitchItem);
