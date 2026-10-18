import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TextSchema } from "../schemas/text-schema";
import { TextWithSubtext } from "./text-with-subtext";

type TextProps = z.infer<typeof TextSchema>;

function TextRenderer({ props }: ComponentRenderProps<TextProps>) {
  return (
    <TextWithSubtext
      value={props.value}
      subtext={props.subtext}
      subtextVariant={props.subtextVariant}
      bold={false}
    />
  );
}

export const Text = defineComponent({
  name: "Text",
  props: TextSchema,
  description:
    "Plain text line with optional subtext. variant 'number' uses tabular number styling; subtextVariant 'metric' colors a leading +/- subtext green/red.",
  component: TextRenderer,
});
