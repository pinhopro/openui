import { defineComponent } from "../library";
import { SliceSchema } from "../schemas/slice-schema";
import { NullRenderer } from "./null-renderer";

export const Slice = defineComponent({
  name: "Slice",
  props: SliceSchema,
  description: "One slice with label and numeric value",
  component: NullRenderer,
});
