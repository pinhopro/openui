import { defineComponent } from "../library";
import { TabItemSchema } from "../schemas/tab-item-schema";

/** A tab is data for its Tabs strip, never drawn on its own. */
function TabItemRenderer() {
  return null;
}

export const TabItem = defineComponent({
  name: "TabItem",
  props: TabItemSchema,
  description: "value is unique id, trigger is tab label, content is array of components",
  component: TabItemRenderer,
});
