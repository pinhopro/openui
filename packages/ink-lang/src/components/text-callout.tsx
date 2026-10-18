import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TextCalloutSchema } from "../schemas/text-callout-schema";
import { CalloutBox } from "./callout-box";

type TextCalloutProps = z.infer<typeof TextCalloutSchema>;

function TextCalloutRenderer({ props }: ComponentRenderProps<TextCalloutProps>) {
  return <CalloutBox variant={props.variant} title={props.title} description={props.description} />;
}

export const TextCallout = defineComponent({
  name: "TextCallout",
  props: TextCalloutSchema,
  description: "Text callout with variant, title, and description",
  component: TextCalloutRenderer,
});
