import type { z } from "zod/v4";
import { useComponentStyle } from "../design/design-system-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TextContentSchema } from "../schemas/text-content-schema";
import { mergeTextStyle } from "../theme-styles";
import { MarkdownText } from "./markdown-text";
import { displayText } from "./pad";
import { textContentStyle } from "./text-content-style";

type TextContentProps = z.infer<typeof TextContentSchema>;

/** Markdown text in one of five sizes; the size is a class the stylesheet can address (`TextContent.small`). */
function TextContentRenderer({ props }: ComponentRenderProps<TextContentProps>) {
  const size = typeof props.size === "string" ? props.size : "default";
  const computed = useComponentStyle([size]);
  const sized = textContentStyle(props.size);
  const base = {
    ...computed,
    text: mergeTextStyle(
      { bold: sized.bold, dim: sized.dimColor, underline: sized.underline },
      computed.text,
    ),
  };
  return <MarkdownText text={displayText(props.text)} base={base} />;
}

export const TextContent = defineComponent({
  name: "TextContent",
  props: TextContentSchema,
  description:
    'Text block. Supports markdown. Optional size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
  component: TextContentRenderer,
});
