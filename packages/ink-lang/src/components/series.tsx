import { defineComponent } from "../library";
import { SeriesSchema } from "../schemas/series-schema";
import { NullRenderer } from "./null-renderer";

export const Series = defineComponent({
  name: "Series",
  props: SeriesSchema,
  description: "One data series",
  component: NullRenderer,
});
