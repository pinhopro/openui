import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ImageBlockSchema } from "../schemas/image-block-schema";
import { ImagePlaceholder } from "./image-placeholder";

type ImageBlockProps = z.infer<typeof ImageBlockSchema>;

function ImageBlockRenderer({ props }: ComponentRenderProps<ImageBlockProps>) {
  return <ImagePlaceholder alt={props.alt} src={props.src} />;
}

export const ImageBlock = defineComponent({
  name: "ImageBlock",
  props: ImageBlockSchema,
  description: "Image block with loading state",
  component: ImageBlockRenderer,
});
