import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ImageTextSchema } from "../schemas/image-text-schema";
import { displayText } from "./pad";
import { TitledLine } from "./titled-line";

type ImageTextProps = z.infer<typeof ImageTextSchema>;

const IMAGE_MARK = "▣";

function ImageTextRenderer({ props }: ComponentRenderProps<ImageTextProps>) {
  return (
    <TitledLine
      lead={IMAGE_MARK}
      leadColor={undefined}
      title={displayText(props.title)}
      subtitle={displayText(props.subtitle)}
      bold={props.bold === true}
      layout={props.layout}
    />
  );
}

export const ImageText = defineComponent({
  name: "ImageText",
  props: ImageTextSchema,
  description:
    "A small square image (thumbnail/avatar) with a title and optional subtitle. src must be a real image URL.",
  component: ImageTextRenderer,
});
