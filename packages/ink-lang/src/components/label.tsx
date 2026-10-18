import { Text } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { LabelSchema } from "../schemas/label-schema";

type LabelProps = z.infer<typeof LabelSchema>;

function LabelRenderer({ props }: ComponentRenderProps<LabelProps>) {
  const text = props.text === null || props.text === undefined ? "" : String(props.text);
  return <Text>{text}</Text>;
}

export const Label = defineComponent({
  name: "Label",
  props: LabelSchema,
  description: "Text label",
  component: LabelRenderer,
});
