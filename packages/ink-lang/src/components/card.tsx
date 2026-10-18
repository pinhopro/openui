import { Box } from "ink";
import type { z } from "zod/v4";
import { useComponentStyle, useDesignSystem } from "../design/design-system-context";
import { layoutBoxProps } from "../design/layout-props";
import { defineComponent, type ComponentRenderProps } from "../library";
import { CardSchema } from "../schemas/card-schema";
import { boxProps } from "../theme-styles";
import { flexBoxProps } from "./flex-box-props";

type CardProps = z.infer<typeof CardSchema>;

/** A bordered container; the variant is a class the stylesheet addresses (`Card.sunk`). */
function CardRenderer({ props, renderNode }: ComponentRenderProps<CardProps>) {
  const system = useDesignSystem();
  const variant = typeof props.variant === "string" ? props.variant : "card";
  const computed = useComponentStyle([variant]);
  const box = flexBoxProps(props, system.tokens.spacing);
  const style = boxProps(computed.box);
  return (
    <Box
      flexDirection={box.flexDirection}
      gap={computed.gap ?? box.gap}
      alignItems={box.alignItems}
      justifyContent={box.justifyContent}
      flexWrap={box.flexWrap}
      borderStyle={style.borderStyle}
      borderColor={style.borderColor}
      borderDimColor={style.borderDimColor}
      backgroundColor={style.backgroundColor}
      paddingX={style.paddingX}
      paddingY={style.paddingY}
      {...layoutBoxProps(computed)}
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
