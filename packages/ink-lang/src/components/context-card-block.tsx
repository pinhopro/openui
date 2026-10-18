import type { ElementNode } from "@openuidev/lang-core";
import { Box, Text } from "ink";
import type { z } from "zod/v4";
import { isElementValue } from "../element-node";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ContextCardBlockSchema } from "../schemas/context-card-block-schema";
import { CardBlock, cardBlockItems, type CardBlockItem } from "./card-block";
import { elementStringProp } from "./card-item-action";
import { ImagePlaceholder } from "./image-placeholder";
import { MarkdownText } from "./markdown-text";
import { displayText } from "./pad";
import { textContentStyle } from "./text-content-style";

type ContextCardBlockProps = z.infer<typeof ContextCardBlockSchema>;

/** Summary cards: a bold title (or a Tag), the markdown body and the background image as a placeholder. */
function ContextCardBlockRenderer({
  props,
  renderNode,
}: ComponentRenderProps<ContextCardBlockProps>) {
  const elements = cardBlockItems(props.items);
  const items: CardBlockItem[] = [];
  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index] as ElementNode;
    const id = elementStringProp(element, "id");
    const title = element.props["title"];
    const titleText = isElementValue(title) ? elementStringProp(title, "text") : displayText(title);
    const body = displayText(element.props["body"]);
    const imageSrc = displayText(element.props["bgImageSrc"]);
    items.push({
      label: titleText ?? id ?? `Context card ${index + 1}`,
      context: {
        itemIndex: index,
        itemId: id,
        itemTitle: titleText,
        itemBody: body === "" ? undefined : body,
      },
      content: (
        <Box flexDirection="column">
          {imageSrc === "" ? null : (
            <ImagePlaceholder alt={element.props["bgImageAlt"]} src={imageSrc} />
          )}
          {isElementValue(title) ? renderNode(title) : <Text bold>{displayText(title)}</Text>}
          {body === "" ? null : <MarkdownText text={body} style={textContentStyle(undefined)} />}
        </Box>
      ),
    });
  }
  return <CardBlock action={props.action} items={items} />;
}

export const ContextCardBlock = defineComponent({
  name: "ContextCardBlock",
  props: ContextCardBlockSchema,
  description:
    "A grid or carousel of compact tinted context cards (title or tag plus a short bold body); an optional action makes every card clickable.",
  component: ContextCardBlockRenderer,
});
