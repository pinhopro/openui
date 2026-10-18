import { defineComponent } from "../library";
import { PointSchema } from "../schemas/point-schema";
import { NullRenderer } from "./null-renderer";

export const Point = defineComponent({
  name: "Point",
  props: PointSchema,
  description: "Data point with numeric coordinates",
  component: NullRenderer,
});
