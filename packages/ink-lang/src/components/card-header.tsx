import { Box, Text } from "ink";
import type { z } from "zod/v4";
import { useComponentStyle } from "../design/design-system-context";
import { transformText } from "../design/layout-props";
import { defineComponent, type ComponentRenderProps } from "../library";
import { CardHeaderSchema } from "../schemas/card-header-schema";
import { textProps } from "../theme-styles";
import { lineTextStyle } from "./markdown-text";

type CardHeaderProps = z.infer<typeof CardHeaderSchema>;

/** A title line and a subtitle line; `.title` and `.subtitle` in the stylesheet (text-transform and font-size included). */
function CardHeaderRenderer({ props }: ComponentRenderProps<CardHeaderProps>) {
  const title = useComponentStyle(["title"]);
  const subtitle = useComponentStyle(["subtitle"]);
  const hasTitle = props.title !== undefined && props.title !== null;
  const hasSubtitle = props.subtitle !== undefined && props.subtitle !== null;
  if (!hasTitle && !hasSubtitle) return null;
  return (
    <Box flexDirection="column">
      {hasTitle ? (
        <Text {...textProps(lineTextStyle(title))}>
          {transformText(String(props.title), title.transform)}
        </Text>
      ) : null}
      {hasSubtitle ? (
        <Text {...textProps(lineTextStyle(subtitle))}>
          {transformText(String(props.subtitle), subtitle.transform)}
        </Text>
      ) : null}
    </Box>
  );
}

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: CardHeaderSchema,
  description: "Header with optional title and subtitle",
  component: CardHeaderRenderer,
});
