import { defineComponent } from "../library";
import { SnippetCardItemSchema } from "../schemas/snippet-card-item-schema";

/** An item is data for its SnippetCardBlock, never drawn on its own. */
function SnippetCardItemRenderer() {
  return null;
}

export const SnippetCardItem = defineComponent({
  name: "SnippetCardItem",
  props: SnippetCardItemSchema,
  description:
    "One row-style snippet card: a label on the left (IconText or ImageText) and an optional value on the right (Text or BoldText).",
  component: SnippetCardItemRenderer,
});
