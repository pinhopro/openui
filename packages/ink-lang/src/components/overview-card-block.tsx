import type { ElementNode } from "@openuidev/lang-core";
import { Box } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { OverviewCardBlockSchema } from "../schemas/overview-card-block-schema";
import { CardBlock, cardBlockItems, type CardBlockItem } from "./card-block";
import { elementStringProp } from "./card-item-action";

type OverviewCardBlockProps = z.infer<typeof OverviewCardBlockSchema>;

/** KPI cards: the heading slot on top, the inline metric under it. */
function OverviewCardBlockRenderer({
  props,
  renderNode,
}: ComponentRenderProps<OverviewCardBlockProps>) {
  const elements = cardBlockItems(props.items);
  const items: CardBlockItem[] = [];
  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index] as ElementNode;
    const id = elementStringProp(element, "id");
    const top = element.props["top"];
    const bottom = element.props["bottom"];
    const title = elementStringProp(top, "title") ?? elementStringProp(top, "value");
    items.push({
      label: title ?? id ?? `Overview card ${index + 1}`,
      context: {
        itemIndex: index,
        itemId: id,
        itemTitle: title,
        itemSubtitle: elementStringProp(top, "subtitle") ?? elementStringProp(top, "subtext"),
        itemMetricValue: elementStringProp(bottom, "value"),
      },
      content: (
        <Box flexDirection="column">
          {renderNode(top)}
          {bottom === undefined || bottom === null ? null : renderNode(bottom)}
        </Box>
      ),
    });
  }
  return <CardBlock action={props.action} items={items} />;
}

export const OverviewCardBlock = defineComponent({
  name: "OverviewCardBlock",
  props: OverviewCardBlockSchema,
  description:
    "A grid or horizontal carousel of compact overview cards, each with a heading (icon/image/text) on top and an inline metric below; optionally clickable with a shared action.",
  component: OverviewCardBlockRenderer,
});
