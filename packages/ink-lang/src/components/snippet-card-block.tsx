import type { ElementNode } from "@openuidev/lang-core";
import { Box } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { SnippetCardBlockSchema } from "../schemas/snippet-card-block-schema";
import { CardBlock, cardBlockItems, type CardBlockItem } from "./card-block";
import { elementStringProp } from "./card-item-action";

type SnippetCardBlockProps = z.infer<typeof SnippetCardBlockSchema>;

/** Label/value cards: the lhs on top, the rhs under it. */
function SnippetCardBlockRenderer({
  props,
  renderNode,
}: ComponentRenderProps<SnippetCardBlockProps>) {
  const elements = cardBlockItems(props.items);
  const items: CardBlockItem[] = [];
  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index] as ElementNode;
    const id = elementStringProp(element, "id");
    const lhs = element.props["lhs"];
    const rhs = element.props["rhs"];
    const title = elementStringProp(lhs, "title");
    items.push({
      label: title ?? id ?? `Snippet card ${index + 1}`,
      context: {
        itemIndex: index,
        itemId: id,
        itemTitle: title,
        itemSubtitle: elementStringProp(lhs, "subtitle"),
        itemValue: elementStringProp(rhs, "value"),
      },
      content: (
        <Box flexDirection="column">
          {renderNode(lhs)}
          {rhs === undefined || rhs === null ? null : renderNode(rhs)}
        </Box>
      ),
    });
  }
  return <CardBlock action={props.action} items={items} />;
}

export const SnippetCardBlock = defineComponent({
  name: "SnippetCardBlock",
  props: SnippetCardBlockSchema,
  description:
    "A responsive grid of compact label/value cards (2 per row) for showing several short facts side by side; optionally clickable with a shared action.",
  component: SnippetCardBlockRenderer,
});
