import { defineComponent } from "../library";
import { ListItemSchema } from "../schemas/list-item-schema";

/** An item is data for its ListBlock, never drawn on its own. */
function ListItemRenderer() {
  return null;
}

export const ListItem = defineComponent({
  name: "ListItem",
  props: ListItemSchema,
  description:
    "Item in a ListBlock — displays a title with an optional subtitle and image. When action is provided, the item becomes clickable.",
  component: ListItemRenderer,
});
