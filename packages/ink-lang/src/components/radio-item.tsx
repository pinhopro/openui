import { defineComponent } from "../library";
import { RadioItemSchema } from "../schemas/radio-item-schema";

/** A radio option is data for its RadioGroup, never drawn on its own. */
function RadioItemRenderer() {
  return null;
}

export const RadioItem = defineComponent({
  name: "RadioItem",
  props: RadioItemSchema,
  description: "",
  component: RadioItemRenderer,
});
