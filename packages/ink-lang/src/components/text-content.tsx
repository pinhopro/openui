import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TextContentSchema } from "../schemas/text-content-schema";
import { MarkdownText } from "./markdown-text";
import { displayText } from "./pad";
import { textContentStyle } from "./text-content-style";

type TextContentProps = z.infer<typeof TextContentSchema>;

function TextContentRenderer({ props }: ComponentRenderProps<TextContentProps>) {
  const style = textContentStyle(props.size);
  return <MarkdownText text={displayText(props.text)} style={style} />;
}

export const TextContent = defineComponent({
  name: "TextContent",
  props: TextContentSchema,
  description:
    'Text block. Supports markdown. Optional size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
  component: TextContentRenderer,
});
