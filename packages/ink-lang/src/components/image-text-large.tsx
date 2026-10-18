import { Box, Text } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ImageTextLargeSchema } from "../schemas/image-text-large-schema";
import { ImagePlaceholder } from "./image-placeholder";
import { displayText } from "./pad";

type ImageTextLargeProps = z.infer<typeof ImageTextLargeSchema>;

/** The image placeholder line, then the bold title and a dim subtitle. */
function ImageTextLargeRenderer({ props }: ComponentRenderProps<ImageTextLargeProps>) {
  const subtitle = displayText(props.subtitle);
  return (
    <Box flexDirection="column">
      <ImagePlaceholder alt={props.alt} src={props.src} />
      <Text bold>{displayText(props.title)}</Text>
      {subtitle === "" ? null : <Text dimColor>{subtitle}</Text>}
    </Box>
  );
}

export const ImageTextLarge = defineComponent({
  name: "ImageTextLarge",
  props: ImageTextLargeSchema,
  description:
    "A full-width banner image above a bold title and optional subtitle. src must be a real image URL.",
  component: ImageTextLargeRenderer,
});
