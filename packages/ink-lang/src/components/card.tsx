import { Box } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { CardSchema } from "../schemas/card-schema";
import { useTheme, type InkTheme } from "../theme";
import { boxProps, type BoxStyle } from "../theme-styles";
import { flexBoxProps } from "./flex-box-props";

type CardProps = z.infer<typeof CardSchema>;

/** The theme slot of a Card variant: card (default), sunk or clear. */
function cardStyle(variant: string | undefined, theme: InkTheme): BoxStyle {
  if (variant === "clear") return theme.card.clear;
  if (variant === "sunk") return theme.card.sunk;
  return theme.card.card;
}

function CardRenderer({ props, renderNode }: ComponentRenderProps<CardProps>) {
  const theme = useTheme();
  const box = flexBoxProps(props);
  const style = boxProps(cardStyle(props.variant, theme));
  return (
    <Box
      flexDirection={box.flexDirection}
      gap={box.gap}
      alignItems={box.alignItems}
      justifyContent={box.justifyContent}
      flexWrap={box.flexWrap}
      borderStyle={style.borderStyle}
      borderColor={style.borderColor}
      borderDimColor={style.borderDimColor}
      backgroundColor={style.backgroundColor}
      paddingX={style.paddingX}
      paddingY={style.paddingY}
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
