import { Box, Text } from "ink";
import type { z } from "zod/v4";
import { useComponentStyle } from "../design/design-system-context";
import { transformText } from "../design/layout-props";
import { defineComponent, type ComponentRenderProps } from "../library";
import { InlineHeaderSchema } from "../schemas/inline-header-schema";
import { textProps } from "../theme-styles";
import { lineTextStyle } from "./markdown-text";
import { displayText } from "./pad";

type InlineHeaderProps = z.infer<typeof InlineHeaderSchema>;

/** A bold heading and a dim description; `.heading` and `.description` in the stylesheet. */
function InlineHeaderRenderer({ props }: ComponentRenderProps<InlineHeaderProps>) {
  const heading = useComponentStyle(["heading"]);
  const descriptionStyle = useComponentStyle(["description"]);
  const description = displayText(props.description);
  return (
    <Box flexDirection="column">
      <Text {...textProps(lineTextStyle(heading))}>
        {transformText(displayText(props.heading), heading.transform)}
      </Text>
      {description === "" ? null : (
        <Text {...textProps(descriptionStyle.text)}>
          {transformText(description, descriptionStyle.transform)}
        </Text>
      )}
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
