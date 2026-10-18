import { Box, Text, type DOMElement } from "ink";
import { useRef, type ReactNode } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useMouse } from "../mouse/use-mouse";
import { OptionCardsSchema } from "../schemas/option-cards-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
import { useFieldValidation } from "../use-field-validation";
import { useStateField } from "../use-state-field";
import {
  normalizeSelection,
  selectionForValidation,
  selectionItems,
  storedSelection,
  toggleSelection,
  type SelectionItem,
  type SelectionType,
} from "./selection-field";
import { useOptionGroup } from "./use-option-group";

type OptionCardsProps = z.infer<typeof OptionCardsSchema>;

const SELECTED_MARK = "●";
const UNSELECTED_MARK = "○";

interface OptionCardBoxProps {
  item: SelectionItem;
  isSelected: boolean;
  isCursor: boolean;
  topContent: ReactNode;
  onPress: () => void;
}

/** A bordered card: the top content, a marked title (inverse under the cursor) and a dim subtitle. A click presses it. */
function OptionCardBox({ item, isSelected, isCursor, topContent, onPress }: OptionCardBoxProps) {
  const theme = useTheme();
  const cardRef = useRef<DOMElement | null>(null);
  const cursorStyle = isCursor ? textProps(theme.focusRing) : textProps({});
  useMouse(cardRef, {
    onClick: function handleClick() {
      onPress();
    },
  });
  return (
    <Box
      ref={cardRef}
      flexDirection="column"
      borderStyle={isSelected ? "round" : "single"}
      borderColor={isSelected ? theme.accent : undefined}
      borderDimColor={!isSelected}
      paddingX={1}
    >
      {topContent}
      <Text dimColor={item.disabled}>
        {(isSelected ? SELECTED_MARK : UNSELECTED_MARK) + " "}
        <Text {...cursorStyle} bold={isSelected ? true : cursorStyle.bold}>
          {item.label}
        </Text>
      </Text>
      {item.subtitle === "" ? null : <Text dimColor>{"  " + item.subtitle}</Text>}
    </Box>
  );
}

/**
 * A column of selectable cards with one focus stop: the arrow keys move, Space
 * or Enter toggles the card under the cursor. Single groups keep one value,
 * multiple groups a list, stored under `name` like in react-ui.
 */
function OptionCardsRenderer({ props, renderNode }: ComponentRenderProps<OptionCardsProps>) {
  const field = useStateField<unknown>(props.name);
  const type: SelectionType = props.type === "multiple" ? "multiple" : "single";
  const items = selectionItems(props.items);
  const selection = normalizeSelection(type, field.value, props.defaultValue);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const group = useOptionGroup({
    count: items.length,
    orientation: "vertical",
    name: field.name,
    onPress: function toggle(index) {
      const item = items[index];
      if (item === undefined || item.disabled) return;
      const next = toggleSelection(type, selectionRef.current, item.value);
      selectionRef.current = next;
      field.setValue(storedSelection(type, next));
      validation.validate(selectionForValidation(type, next));
    },
  });

  const validation = useFieldValidation({
    fieldName: field.name,
    rules: props.rules,
    isFocused: group.isFocused,
    getValue: function readValue() {
      return selectionForValidation(type, selectionRef.current);
    },
  });

  if (items.length === 0) return null;
  const cards: ReactNode[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] as SelectionItem;
    cards.push(
      <OptionCardBox
        key={item.value}
        item={item}
        isSelected={selection.includes(item.value)}
        isCursor={group.isFocused && index === group.cursor}
        topContent={item.topContent === undefined ? null : renderNode(item.topContent)}
        onPress={function pressThis() {
          group.pressAt(index);
        }}
      />,
    );
  }
  return (
    <Box ref={group.ref} flexDirection="column">
      {cards}
    </Box>
  );
}

export const OptionCards = defineComponent({
  name: "OptionCards",
  props: OptionCardsSchema,
  description:
    "A form field of selectable cards (title, optional subtitle, optional icon or image) laid out in a responsive grid for choosing one or many options; the selection is stored under `name`.",
  component: OptionCardsRenderer,
});
