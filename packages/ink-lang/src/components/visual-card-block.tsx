import type { ElementNode } from "@openuidev/lang-core";
import { Box } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { VisualCardBlockSchema } from "../schemas/visual-card-block-schema";
import { CardBlock, cardBlockItems, type CardBlockItem } from "./card-block";
import { elementStringProp } from "./card-item-action";
import { ImagePlaceholder } from "./image-placeholder";
import { displayText } from "./pad";

type VisualCardBlockProps = z.infer<typeof VisualCardBlockSchema>;

/** Photo-first cards: the image placeholder, the tag and the bold body. */
function VisualCardBlockRenderer({
  props,
  renderNode,
}: ComponentRenderProps<VisualCardBlockProps>) {
  const elements = cardBlockItems(props.items);
  const items: CardBlockItem[] = [];
  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index] as ElementNode;
    const id = elementStringProp(element, "id");
    const body = element.props["body"];
    const tag = element.props["tag"];
    const imageSrc = displayText(element.props["bgImageSrc"]);
    const title = elementStringProp(body, "value");
    items.push({
      label: title ?? id ?? `Visual card ${index + 1}`,
      context: {
        itemIndex: index,
        itemId: id,
        itemTitle: title,
        itemTag: elementStringProp(tag, "text"),
      },
      content: (
        <Box flexDirection="column">
          {imageSrc === "" ? null : (
            <ImagePlaceholder alt={element.props["bgImageAlt"]} src={imageSrc} />
          )}
          {tag === undefined || tag === null ? null : renderNode(tag)}
          {renderNode(body)}
        </Box>
      ),
    });
  }
  return <CardBlock action={props.action} items={items} />;
}

export const VisualCardBlock = defineComponent({
  name: "VisualCardBlock",
  props: VisualCardBlockSchema,
  description:
    "A grid or carousel of photo-first cards: a full-bleed background image with a tag on top and a bold text panel at the bottom; an optional action makes every card clickable.",
  component: VisualCardBlockRenderer,
});
