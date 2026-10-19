import type { ActionPlan, ElementNode } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming, useTriggerAction } from "../context";
import { isElementValue } from "../element-node";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ListBlockSchema } from "../schemas/list-block-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
import { isPressKey } from "./button-keys";
import { displayText } from "./pad";

type ListBlockProps = z.infer<typeof ListBlockSchema>;

const IMAGE_MARK = "▣";

interface ListEntryProps {
  item: ElementNode;
  marker: string;
}

interface ActionableEntryProps extends ListEntryProps {
  /** The item's position in the list: its stop's order. */
  index: number;
}

/** The ListItem elements of the block; anything else the model wrote is skipped. */
function listItems(items: unknown): ElementNode[] {
  const result: ElementNode[] = [];
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    if (isElementValue(item)) result.push(item);
  }
  return result;
}

/** A focusable line that fires the item's action on Enter or Space. */
function ActionableEntry({ item, marker, index }: ActionableEntryProps) {
  const triggerAction = useTriggerAction();
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const title = displayText(item.props["title"]);
  const actionLabel = displayText(item.props["actionLabel"]);

  function press(): void {
    void triggerAction(title, undefined, item.props["action"] as ActionPlan | undefined);
  }

  const focusable = useFocusable({
    isActive: !isStreaming,
    name: title,
    order: index,
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) press();
      },
    },
  });

  useInput(
    function handleEntryKey(input, key) {
      if (isPressKey(input, key)) press();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  return (
    <Box ref={focusable.ref}>
      <Text>
        {marker + " "}
        <Text {...(focusable.isFocused ? textProps(theme.focusRing) : {})}>{title}</Text>
        {actionLabel === "" ? null : <Text dimColor>{"  (" + actionLabel + ")"}</Text>}
      </Text>
    </Box>
  );
}

function PlainEntry({ item, marker }: ListEntryProps) {
  return <Text>{marker + " " + displayText(item.props["title"])}</Text>;
}

/** Numbered (or image-marked) titles, each with a dim indented subtitle. */
function ListBlockRenderer({ props }: ComponentRenderProps<ListBlockProps>) {
  const items = listItems(props.items);
  if (items.length === 0) return null;
  const isImageList = props.variant === "image";
  const lines: ReactNode[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] as ElementNode;
    const marker = isImageList ? IMAGE_MARK : `${index + 1}.`;
    const hasAction = item.props["action"] !== undefined && item.props["action"] !== null;
    lines.push(
      hasAction ? (
        <ActionableEntry key={index} item={item} marker={marker} index={index} />
      ) : (
        <PlainEntry key={index} item={item} marker={marker} />
      ),
    );
    const subtitle = displayText(item.props["subtitle"]);
    if (subtitle !== "") {
      lines.push(
        <Text key={`${index}-subtitle`} dimColor>
          {" ".repeat(marker.length + 1) + subtitle}
        </Text>,
      );
    }
  }
  return <Box flexDirection="column">{lines}</Box>;
}

export const ListBlock = defineComponent({
  name: "ListBlock",
  props: ListBlockSchema,
  description:
    "A list of items with number or image indicators. Each item can optionally have an action. size small renders a compact list.",
  component: ListBlockRenderer,
});
