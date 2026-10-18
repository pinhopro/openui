import { Box } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { MarkDownRendererSchema } from "../schemas/mark-down-renderer-schema";
import { useTheme } from "../theme";
import { MarkdownText } from "./markdown-text";
import { displayText } from "./pad";
import { textContentStyle } from "./text-content-style";

type MarkDownRendererProps = z.infer<typeof MarkDownRendererSchema>;

/** Markdown text, optionally inside a card (round) or sunk (single dim) border. */
function MarkDownRendererRenderer({ props }: ComponentRenderProps<MarkDownRendererProps>) {
  const theme = useTheme();
  const text = (
    <MarkdownText text={displayText(props.textMarkdown)} style={textContentStyle(undefined)} />
  );
  if (props.variant === "card") {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor={theme.accent} paddingX={1}>
        {text}
      </Box>
    );
  }
  if (props.variant === "sunk") {
    return (
      <Box flexDirection="column" borderStyle="single" borderDimColor paddingX={1}>
        {text}
      </Box>
    );
  }
  return text;
}

export const MarkDownRenderer = defineComponent({
  name: "MarkDownRenderer",
  props: MarkDownRendererSchema,
  description: "Renders markdown text with optional container variant",
  component: MarkDownRendererRenderer,
});
