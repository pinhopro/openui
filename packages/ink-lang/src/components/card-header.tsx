import { Box, Text } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { CardHeaderSchema } from "../schemas/card-header-schema";
import { useTheme } from "../theme";

type CardHeaderProps = z.infer<typeof CardHeaderSchema>;

function CardHeaderRenderer({ props }: ComponentRenderProps<CardHeaderProps>) {
  const theme = useTheme();
  const hasTitle = props.title !== undefined && props.title !== null;
  const hasSubtitle = props.subtitle !== undefined && props.subtitle !== null;
  if (!hasTitle && !hasSubtitle) return null;
  return (
    <Box flexDirection="column">
      {hasTitle ? (
        <Text bold color={theme.accent}>
          {String(props.title)}
        </Text>
      ) : null}
      {hasSubtitle ? <Text dimColor>{String(props.subtitle)}</Text> : null}
    </Box>
  );
}

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: CardHeaderSchema,
  description: "Header with optional title and subtitle",
  component: CardHeaderRenderer,
});
