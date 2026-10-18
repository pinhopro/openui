import { defineComponent } from "../library";
import { SwitchItemSchema } from "../schemas/switch-item-schema";

/** A switch is data for its SwitchGroup, never drawn on its own. */
function SwitchItemRenderer() {
  return null;
}

export const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: SwitchItemSchema,
  description: "Individual switch toggle",
  component: SwitchItemRenderer,
});
