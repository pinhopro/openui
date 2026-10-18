import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ImageSchema } from "../schemas/image-schema";
import { ImagePlaceholder } from "./image-placeholder";

type ImageProps = z.infer<typeof ImageSchema>;

function ImageRenderer({ props }: ComponentRenderProps<ImageProps>) {
  return <ImagePlaceholder alt={props.alt} src={props.src} />;
}

export const Image = defineComponent({
  name: "Image",
  props: ImageSchema,
  description: "Image with alt text and optional URL",
  component: ImageRenderer,
});
