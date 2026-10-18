import { defineComponent } from "../library";
import { CheckBoxItemSchema } from "../schemas/check-box-item-schema";

/** A box is data for its CheckBoxGroup, never drawn on its own. */
function CheckBoxItemRenderer() {
  return null;
}

export const CheckBoxItem = defineComponent({
  name: "CheckBoxItem",
  props: CheckBoxItemSchema,
  description: "",
  component: CheckBoxItemRenderer,
});
