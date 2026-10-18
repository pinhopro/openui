import { defineComponent } from "../library";
import { SelectItemSchema } from "../schemas/select-item-schema";

/** An option is data for its Select, never drawn on its own. */
function SelectItemRenderer() {
  return null;
}

export const SelectItem = defineComponent({
  name: "SelectItem",
  props: SelectItemSchema,
  description: "Option for Select",
  component: SelectItemRenderer,
});
