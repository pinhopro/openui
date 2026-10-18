import { defineComponent } from "../library";
import { ScatterSeriesSchema } from "../schemas/scatter-series-schema";
import { NullRenderer } from "./null-renderer";

export const ScatterSeries = defineComponent({
  name: "ScatterSeries",
  props: ScatterSeriesSchema,
  description: "Named dataset",
  component: NullRenderer,
});
