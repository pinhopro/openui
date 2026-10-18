import { defineComponent } from "../library";
import { ContextCardItemSchema } from "../schemas/context-card-item-schema";

/** An item is data for its ContextCardBlock, never drawn on its own. */
function ContextCardItemRenderer() {
  return null;
}

export const ContextCardItem = defineComponent({
  name: "ContextCardItem",
  props: ContextCardItemSchema,
  description:
    "A single card inside a ContextCardBlock: a title (plain string or Tag), an optional markdown body, and an optional gray tint or background image.",
  component: ContextCardItemRenderer,
});
