import { defineComponent } from "../library";
import { AccordionItemSchema } from "../schemas/accordion-item-schema";

/** A section is data for its Accordion, never drawn on its own. */
function AccordionItemRenderer() {
  return null;
}

export const AccordionItem = defineComponent({
  name: "AccordionItem",
  props: AccordionItemSchema,
  description: "value is unique id, trigger is section title",
  component: AccordionItemRenderer,
});
