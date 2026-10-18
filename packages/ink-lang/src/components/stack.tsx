import { Box } from "ink";
import type { z } from "zod/v4";
import { useComponentStyle, useDesignSystem } from "../design/design-system-context";
import { layoutBoxProps } from "../design/layout-props";
import { defineComponent, type ComponentRenderProps } from "../library";
import { StackSchema } from "../schemas/stack-schema";
import { boxProps } from "../theme-styles";
import { flexBoxProps } from "./flex-box-props";

type StackProps = z.infer<typeof StackSchema>;

/** A flex container; its gap words read the spacing tokens and `Stack { ... }` rules style its box. */
function StackRenderer({ props, renderNode }: ComponentRenderProps<StackProps>) {
  const system = useDesignSystem();
  const computed = useComponentStyle();
  const box = flexBoxProps(props, system.tokens.spacing);
  const styled = boxProps(computed.box);
  return (
    <Box
      flexDirection={box.flexDirection}
      gap={computed.gap ?? box.gap}
      alignItems={box.alignItems}
      justifyContent={box.justifyContent}
      flexWrap={box.flexWrap}
      borderStyle={styled.borderStyle}
      borderColor={styled.borderColor}
      borderDimColor={styled.borderDimColor}
      backgroundColor={styled.backgroundColor}
      paddingX={styled.paddingX}
      paddingY={styled.paddingY}
      {...layoutBoxProps(computed)}
    >
      {renderNode(props.children)}
    </Box>
  );
}

export const Stack = defineComponent({
  name: "Stack",
  props: StackSchema,
  description:
    'Flex container. direction: "row"|"column" (default "column"). gap: "none"|"xs"|"s"|"m"|"l"|"xl"|"2xl" (default "m"). align: "start"|"center"|"end"|"stretch"|"baseline". justify: "start"|"center"|"end"|"between"|"around"|"evenly".',
  component: StackRenderer,
});
