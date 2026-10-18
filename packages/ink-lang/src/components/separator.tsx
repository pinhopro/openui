import { Box } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { SeparatorSchema } from "../schemas/separator-schema";

type SeparatorProps = z.infer<typeof SeparatorSchema>;

/** A dim rule: one border edge of a Box, so it spans whatever width or height it is given. */
function SeparatorRenderer({ props }: ComponentRenderProps<SeparatorProps>) {
  if (props.orientation === "vertical") {
    return (
      <Box
        borderStyle="single"
        borderLeft
        borderTop={false}
        borderRight={false}
        borderBottom={false}
        borderDimColor
        alignSelf="stretch"
      />
    );
  }
  return (
    <Box
      borderStyle="single"
      borderTop
      borderLeft={false}
      borderRight={false}
      borderBottom={false}
      borderDimColor
    />
  );
}

export const Separator = defineComponent({
  name: "Separator",
  props: SeparatorSchema,
  description: "Visual divider between content sections",
  component: SeparatorRenderer,
});
