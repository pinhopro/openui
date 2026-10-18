import { defineComponent } from "../library";
import { StepsItemSchema } from "../schemas/steps-item-schema";

/** A step is data for its Steps list, never drawn on its own. */
function StepsItemRenderer() {
  return null;
}

export const StepsItem = defineComponent({
  name: "StepsItem",
  props: StepsItemSchema,
  description: "title and details text for one step",
  component: StepsItemRenderer,
});
