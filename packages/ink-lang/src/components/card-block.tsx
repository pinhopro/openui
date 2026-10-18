import type { ElementNode } from "@openuidev/lang-core";
import { Box, useInput } from "ink";
import type { ReactNode } from "react";
import { useIsStreaming, useTriggerAction } from "../context";
import { isElementValue } from "../element-node";
import { useFocusable } from "../focus/use-focusable";
import { useFormName } from "../form-name-context";
import { useTheme } from "../theme";
import { isPressKey } from "./button-keys";
import { withItemContext, type ItemContext } from "./card-item-action";

/** What a block tells the shared renderer about one of its items. */
export interface CardBlockItem {
  /** The label the action is fired with (the card's title, id or a numbered fallback). */
  label: string;
  /** The item context folded into the block's action. */
  context: ItemContext;
  content: ReactNode;
}

export interface CardBlockProps {
  action: unknown;
  items: CardBlockItem[];
}

/** The item elements of a card block; anything else the model wrote is skipped. */
export function cardBlockItems(items: unknown): ElementNode[] {
  const result: ElementNode[] = [];
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    if (isElementValue(item)) result.push(item);
  }
  return result;
}

interface PressableCardProps {
  item: CardBlockItem;
  action: unknown;
}

/** A card the user can press: Enter or Space fires the block's action with the card's context. */
function PressableCard({ item, action }: PressableCardProps) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const focusable = useFocusable({ isActive: !isStreaming });

  useInput(
    function handleCardKey(input, key) {
      if (!isPressKey(input, key)) return;
      void triggerAction(item.label, formName, withItemContext(action, item.context));
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={focusable.isFocused ? theme.accent : undefined}
      borderDimColor={!focusable.isFocused}
      paddingX={1}
    >
      {item.content}
    </Box>
  );
}

/**
 * The shared shape of the five card blocks: one dim single-bordered box per
 * item, stacked in a column. With an action every card is a focus stop.
 */
export function CardBlock({ action, items }: CardBlockProps) {
  const hasAction = action !== undefined && action !== null;
  const cards: ReactNode[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] as CardBlockItem;
    if (hasAction) {
      cards.push(<PressableCard key={index} item={item} action={action} />);
      continue;
    }
    cards.push(
      <Box key={index} flexDirection="column" borderStyle="single" borderDimColor paddingX={1}>
        {item.content}
      </Box>,
    );
  }
  if (cards.length === 0) return null;
  return <Box flexDirection="column">{cards}</Box>;
}
