import { Text } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TextContentSchema } from "../schemas/text-content-schema";
import { textContentStyle } from "./text-content-style";

type TextContentProps = z.infer<typeof TextContentSchema>;

function TextContentRenderer({ props }: ComponentRenderProps<TextContentProps>) {
  const style = textContentStyle(props.size);
  const text = props.text === null || props.text === undefined ? "" : String(props.text);
  return (
    <Text bold={style.bold} dimColor={style.dimColor} underline={style.underline}>
      {text}
    </Text>
  );
}

export const TextContent = defineComponent({
  name: "TextContent",
  props: TextContentSchema,
  description:
    'Text block. Supports markdown. Optional size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
  component: TextContentRenderer,
});
