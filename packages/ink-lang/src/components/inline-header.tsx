import { Box, Text } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { InlineHeaderSchema } from "../schemas/inline-header-schema";
import { displayText } from "./pad";

type InlineHeaderProps = z.infer<typeof InlineHeaderSchema>;

function InlineHeaderRenderer({ props }: ComponentRenderProps<InlineHeaderProps>) {
  const description = displayText(props.description);
  return (
    <Box flexDirection="column">
      <Text bold>{displayText(props.heading)}</Text>
      {description === "" ? null : <Text dimColor>{description}</Text>}
    </Box>
  );
}

export const InlineHeader = defineComponent({
  name: "InlineHeader",
  props: InlineHeaderSchema,
  description:
    "Compact section heading with an optional one-line description, for use inside cards.",
  component: InlineHeaderRenderer,
});
