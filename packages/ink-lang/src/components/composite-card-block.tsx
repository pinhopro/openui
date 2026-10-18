import type { ElementNode } from "@openuidev/lang-core";
import { Box } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { CompositeCardBlockSchema } from "../schemas/composite-card-block-schema";
import { CardBlock, cardBlockItems, type CardBlockItem } from "./card-block";
import { elementStringProp } from "./card-item-action";

type CompositeCardBlockProps = z.infer<typeof CompositeCardBlockSchema>;

function footerPart(footer: unknown, key: string): unknown {
  if (typeof footer !== "object" || footer === null) return undefined;
  return (footer as Record<string, unknown>)[key];
}

/** Rich cards: the header, the body elements in a column and the price and button footer. */
function CompositeCardBlockRenderer({
  props,
  renderNode,
}: ComponentRenderProps<CompositeCardBlockProps>) {
  const elements = cardBlockItems(props.items);
  const items: CardBlockItem[] = [];
  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index] as ElementNode;
    const id = elementStringProp(element, "id");
    const header = element.props["header"];
    const footer = element.props["footer"];
    const price = footerPart(footer, "price");
    const button = footerPart(footer, "button");
    const title = elementStringProp(header, "title") ?? elementStringProp(header, "value");
    const hasHeader = header !== undefined && header !== null;
    const hasFooter = price !== undefined || button !== undefined;
    items.push({
      label: title ?? id ?? `Composite card ${index + 1}`,
      context: {
        itemIndex: index,
        itemId: id,
        itemTitle: title,
        itemPrice: elementStringProp(price, "value"),
      },
      content: (
        <Box flexDirection="column" gap={hasHeader || hasFooter ? 1 : 0}>
          {hasHeader ? renderNode(header) : null}
          <Box flexDirection="column">{renderNode(element.props["body"])}</Box>
          {hasFooter ? (
            <Box flexDirection="row" gap={2}>
              {price === undefined ? null : renderNode(price)}
              {button === undefined ? null : renderNode(button)}
            </Box>
          ) : null}
        </Box>
      ),
    });
  }
  return <CardBlock action={props.action} items={items} />;
}

export const CompositeCardBlock = defineComponent({
  name: "CompositeCardBlock",
  props: CompositeCardBlockSchema,
  description:
    "A two-per-row grid or carousel of rich cards, each with an optional header, stacked body content (text, metrics, charts, lists, tags) and a price/button footer; an optional action makes every card clickable.",
  component: CompositeCardBlockRenderer,
});
