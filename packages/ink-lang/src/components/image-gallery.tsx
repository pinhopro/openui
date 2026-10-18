import { Box } from "ink";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ImageGallerySchema } from "../schemas/image-gallery-schema";
import { ImagePlaceholder } from "./image-placeholder";

type ImageGalleryProps = z.infer<typeof ImageGallerySchema>;

/** One placeholder line per image, with its details after the label. */
function ImageGalleryRenderer({ props }: ComponentRenderProps<ImageGalleryProps>) {
  const images = Array.isArray(props.images) ? props.images : [];
  if (images.length === 0) return null;
  const lines: ReactNode[] = [];
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index] as Record<string, unknown> | null | undefined;
    if (typeof image !== "object" || image === null) continue;
    lines.push(
      <ImagePlaceholder
        key={index}
        alt={image["alt"]}
        src={image["src"]}
        details={image["details"]}
      />,
    );
  }
  return <Box flexDirection="column">{lines}</Box>;
}

export const ImageGallery = defineComponent({
  name: "ImageGallery",
  props: ImageGallerySchema,
  description: "Gallery grid of images with modal preview",
  component: ImageGalleryRenderer,
});
