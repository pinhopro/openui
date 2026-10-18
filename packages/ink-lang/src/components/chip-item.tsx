import { defineComponent } from "../library";
import { ChipItemSchema } from "../schemas/chip-item-schema";

/** A chip is data for its Chips group, never drawn on its own. */
function ChipItemRenderer() {
  return null;
}

export const ChipItem = defineComponent({
  name: "ChipItem",
  props: ChipItemSchema,
  description:
    "A single selectable chip inside a Chips group, with a value, label and optional icon.",
  component: ChipItemRenderer,
});
