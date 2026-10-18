import { defineComponent } from "../library";
import { OptionCardSchema } from "../schemas/option-card-schema";

/** A card is data for its OptionCards group, never drawn on its own. */
function OptionCardRenderer() {
  return null;
}

export const OptionCard = defineComponent({
  name: "OptionCard",
  props: OptionCardSchema,
  description:
    "A single selectable card inside an OptionCards group, with a value, title, optional subtitle and an optional Icon or Image on top.",
  component: OptionCardRenderer,
});
