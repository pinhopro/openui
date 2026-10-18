import { Box } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { StackSchema } from "../schemas/stack-schema";
import { flexBoxProps } from "./flex-box-props";

type StackProps = z.infer<typeof StackSchema>;

function StackRenderer({ props, renderNode }: ComponentRenderProps<StackProps>) {
  const box = flexBoxProps(props);
  return (
    <Box
      flexDirection={box.flexDirection}
      gap={box.gap}
      alignItems={box.alignItems}
      justifyContent={box.justifyContent}
      flexWrap={box.flexWrap}
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
