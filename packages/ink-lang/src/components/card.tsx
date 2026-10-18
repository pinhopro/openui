import { Box } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { CardSchema } from "../schemas/card-schema";
import { useTheme } from "../theme";
import { flexBoxProps } from "./flex-box-props";

type CardProps = z.infer<typeof CardSchema>;

interface CardBorder {
  borderStyle: "round" | "single" | undefined;
  borderDimColor: boolean;
  paddingX: number;
}

/** card: round border; sunk: single dim border; clear: no border at all. */
function cardBorder(variant: string | undefined): CardBorder {
  if (variant === "clear") return { borderStyle: undefined, borderDimColor: false, paddingX: 0 };
  if (variant === "sunk") return { borderStyle: "single", borderDimColor: true, paddingX: 1 };
  return { borderStyle: "round", borderDimColor: false, paddingX: 1 };
}

function CardRenderer({ props, renderNode }: ComponentRenderProps<CardProps>) {
  const theme = useTheme();
  const box = flexBoxProps(props);
  const border = cardBorder(props.variant);
  const borderColor = border.borderStyle === "round" ? theme.accent : undefined;
  return (
    <Box
      flexDirection={box.flexDirection}
      gap={box.gap}
      alignItems={box.alignItems}
      justifyContent={box.justifyContent}
      flexWrap={box.flexWrap}
      borderStyle={border.borderStyle}
      borderColor={borderColor}
      borderDimColor={border.borderDimColor}
      paddingX={border.paddingX}
    >
      {renderNode(props.children)}
    </Box>
  );
}

export const Card = defineComponent({
  name: "Card",
  props: CardSchema,
  description:
    'Styled container. variant: "card" (default, elevated) | "sunk" (recessed) | "clear" (transparent). Always full width. Accepts all Stack flex params (default: direction "column"). Cards flex to share space in row/wrap layouts.',
  component: CardRenderer,
});
