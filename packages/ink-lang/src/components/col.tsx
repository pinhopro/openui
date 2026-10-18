import { defineComponent } from "../library";
import { ColSchema } from "../schemas/col-schema";

/** A column is data for its Table, never drawn on its own. */
function ColRenderer() {
  return null;
}

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Column definition — holds label + data array",
  component: ColRenderer,
});
