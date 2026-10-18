import { Box } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ButtonsSchema } from "../schemas/buttons-schema";

type ButtonsProps = z.infer<typeof ButtonsSchema>;

function ButtonsRenderer({ props, renderNode }: ComponentRenderProps<ButtonsProps>) {
  const flexDirection = props.direction === "column" ? "column" : "row";
  return (
    <Box flexDirection={flexDirection} gap={1}>
      {renderNode(props.buttons)}
    </Box>
  );
}

export const Buttons = defineComponent({
  name: "Buttons",
  props: ButtonsSchema,
  description: 'Group of Button components. direction: "row" (default) | "column".',
  component: ButtonsRenderer,
});
