import { defineComponent } from "../library";
import { OverviewCardItemSchema } from "../schemas/overview-card-item-schema";

/** An item is data for its OverviewCardBlock, never drawn on its own. */
function OverviewCardItemRenderer() {
  return null;
}

export const OverviewCardItem = defineComponent({
  name: "OverviewCardItem",
  props: OverviewCardItemSchema,
  description:
    "One overview card: a heading slot at the top (IconText, ImageText or Text) and an optional MetricIndicatorInline at the bottom.",
  component: OverviewCardItemRenderer,
});
