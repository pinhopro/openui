import { Box, Text, type DOMElement } from "ink";
import { useRef, type ReactNode } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useMouse } from "../mouse/use-mouse";
import { ChipsSchema } from "../schemas/chips-schema";
import { useFieldValidation } from "../use-field-validation";
import { useStateField } from "../use-state-field";
import { iconText } from "./icon";
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

type ChipsProps = z.infer<typeof ChipsSchema>;

const SELECTED_MARK = "✓ ";

interface ChipProps {
  item: SelectionItem;
  isSelected: boolean;
  isCursor: boolean;
  onPress: () => void;
}

/** `[✓ label]` when selected, `[ label ]` otherwise; dim when disabled. A click presses it. */
function Chip({ item, isSelected, isCursor, onPress }: ChipProps) {
  const chipRef = useRef<DOMElement | null>(null);
  useMouse(chipRef, {
    onClick: function handleClick() {
      onPress();
    },
  });
  const icon = iconText(item.icon);
  const label = icon === "" ? item.label : icon + " " + item.label;
  const text = isSelected ? "[" + SELECTED_MARK + label + "]" : "[ " + label + " ]";
  return (
    <Box ref={chipRef}>
      <Text inverse={isCursor} bold={isSelected} dimColor={item.disabled}>
        {text}
      </Text>
    </Box>
  );
}

/**
 * A wrapping row of chips with one focus stop: the arrow keys move between
 * chips, Space or Enter toggles the one under the cursor. Single groups keep
 * one value, multiple groups a list, stored under `name` like in react-ui.
 */
function ChipsRenderer({ props }: ComponentRenderProps<ChipsProps>) {
  const field = useStateField<unknown>(props.name);
  const type: SelectionType = props.type === "single" ? "single" : "multiple";
  const items = selectionItems(props.items);
  const selection = normalizeSelection(type, field.value, props.defaultValue);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const group = useOptionGroup({
    count: items.length,
    orientation: "horizontal",
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
  const chips: ReactNode[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] as SelectionItem;
    chips.push(
      <Chip
        key={item.value}
        item={item}
        isSelected={selection.includes(item.value)}
        isCursor={group.isFocused && index === group.cursor}
        onPress={function pressThis() {
          group.pressAt(index);
        }}
      />,
    );
  }
  return (
    <Box ref={group.ref} flexDirection="row" flexWrap="wrap" gap={1}>
      {chips}
    </Box>
  );
}

export const Chips = defineComponent({
  name: "Chips",
  props: ChipsSchema,
  description:
    "A form field of compact selectable chips for choosing one or many short options; the selection is stored under `name`.",
  component: ChipsRenderer,
});
