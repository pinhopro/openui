import { defineComponent } from "../library";
import { VisualCardItemSchema } from "../schemas/visual-card-item-schema";

/** An item is data for its VisualCardBlock, never drawn on its own. */
function VisualCardItemRenderer() {
  return null;
}

export const VisualCardItem = defineComponent({
  name: "VisualCardItem",
  props: VisualCardItemSchema,
  description:
    "A single photo-first card inside a VisualCardBlock: a BoldText body panel, an optional Tag, and a background image (bgImageSrc must be a real URL; bgImageAlt is its alt text).",
  component: VisualCardItemRenderer,
});
