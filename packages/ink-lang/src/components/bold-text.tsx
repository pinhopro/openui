import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { BoldTextSchema } from "../schemas/bold-text-schema";
import { TextWithSubtext } from "./text-with-subtext";

type BoldTextProps = z.infer<typeof BoldTextSchema>;

function BoldTextRenderer({ props }: ComponentRenderProps<BoldTextProps>) {
  return (
    <TextWithSubtext
      value={props.value}
      subtext={props.subtext}
      subtextVariant={props.subtextVariant}
      bold
    />
  );
}

export const BoldText = defineComponent({
  name: "BoldText",
  props: BoldTextSchema,
  description:
    "Emphasized (bold) text line with optional subtext. variant 'number' uses tabular number styling; subtextVariant 'metric' colors a leading +/- subtext green/red.",
  component: BoldTextRenderer,
});
