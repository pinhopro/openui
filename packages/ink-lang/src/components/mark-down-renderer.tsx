import { Box } from "ink";
import type { z } from "zod/v4";
import { useComponentStyle } from "../design/design-system-context";
import { layoutBoxProps } from "../design/layout-props";
import { defineComponent, type ComponentRenderProps } from "../library";
import { MarkDownRendererSchema } from "../schemas/mark-down-renderer-schema";
import { useTheme } from "../theme";
import { boxProps } from "../theme-styles";
import { MarkdownText } from "./markdown-text";
import { displayText } from "./pad";

type MarkDownRendererProps = z.infer<typeof MarkDownRendererSchema>;

/**
 * Markdown text, optionally inside a card (round) or sunk (single dim)
 * border; the variant is a class the stylesheet can address.
 */
function MarkDownRendererRenderer({ props }: ComponentRenderProps<MarkDownRendererProps>) {
  const theme = useTheme();
  const variant = typeof props.variant === "string" ? props.variant : "clear";
  const computed = useComponentStyle([variant]);
  const text = <MarkdownText text={displayText(props.textMarkdown)} base={computed} />;
  const box = boxProps(computed.box);
  const layout = layoutBoxProps(computed);
  const borderStyle =
    box.borderStyle ?? (variant === "card" ? "round" : variant === "sunk" ? "single" : undefined);
  if (borderStyle === undefined && box.backgroundColor === undefined) return text;
  return (
    <Box
      flexDirection="column"
      borderStyle={borderStyle}
      borderColor={box.borderColor ?? (variant === "card" ? theme.accent : undefined)}
      borderDimColor={box.borderDimColor ?? variant === "sunk"}
      backgroundColor={box.backgroundColor}
      paddingX={box.paddingX ?? 1}
      paddingY={box.paddingY}
      {...layout}
    >
      {text}
    </Box>
  );
}

export const MarkDownRenderer = defineComponent({
  name: "MarkDownRenderer",
  props: MarkDownRendererSchema,
  description: "Renders markdown text with optional container variant",
  component: MarkDownRendererRenderer,
});
