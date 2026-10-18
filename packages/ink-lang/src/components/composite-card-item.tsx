import { defineComponent } from "../library";
import { CompositeCardItemSchema } from "../schemas/composite-card-item-schema";

/** An item is data for its CompositeCardBlock, never drawn on its own. */
function CompositeCardItemRenderer() {
  return null;
}

export const CompositeCardItem = defineComponent({
  name: "CompositeCardItem",
  props: CompositeCardItemSchema,
  description:
    "A single card inside a CompositeCardBlock: an optional header (icon/image/text), a stack of body elements (text, metrics, charts, lists, tags), and an optional price/button footer.",
  component: CompositeCardItemRenderer,
});
