import { Box } from "ink";
import { useRef, type ReactNode } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { CheckBoxGroupSchema } from "../schemas/check-box-group-schema";
import { useFieldValidation } from "../use-field-validation";
import { useStateField } from "../use-state-field";
import { checkedAggregate, checkedItems, type CheckedItem } from "./checked-aggregate";
import { OptionLine } from "./option-line";
import { useOptionGroup } from "./use-option-group";

type CheckBoxGroupProps = z.infer<typeof CheckBoxGroupSchema>;

const CHECKED_MARK = "[x]";
const UNCHECKED_MARK = "[ ]";

/**
 * One focus stop for the whole group: Up and Down move between boxes, Space or
 * Enter toggles the one under the cursor. The stored value is the aggregate
 * `{ itemName: boolean }` like in the React library.
 */
function CheckBoxGroupRenderer({ props }: ComponentRenderProps<CheckBoxGroupProps>) {
  const field = useStateField<unknown>(props.name, props.value);
  const items = checkedItems(props.items);
  const aggregate = checkedAggregate(items, field.value);
  const aggregateRef = useRef(aggregate);
  aggregateRef.current = aggregate;
  const storedRef = useRef(field.value);
  storedRef.current = field.value;

  const group = useOptionGroup({
    count: items.length,
    orientation: "vertical",
    name: field.name,
    onPress: function toggle(index) {
      const item = items[index];
      if (item === undefined) return;
      const next = { ...aggregateRef.current, [item.name]: !aggregateRef.current[item.name] };
      aggregateRef.current = next;
      storedRef.current = next;
      field.setValue(next);
      validation.validate(next);
    },
  });

  const validation = useFieldValidation({
    fieldName: field.name,
    rules: props.rules,
    isFocused: group.isFocused,
    getValue: function readValue() {
      return storedRef.current;
    },
  });

  if (items.length === 0) return null;
  const lines: ReactNode[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] as CheckedItem;
    lines.push(
      <OptionLine
        key={item.name}
        mark={aggregate[item.name] === true ? CHECKED_MARK : UNCHECKED_MARK}
        label={item.label}
        description={item.description}
        isCursor={group.isFocused && index === group.cursor}
        onPress={function pressThis() {
          group.pressAt(index);
        }}
      />,
    );
  }
  return (
    <Box ref={group.ref} flexDirection="column">
      {lines}
    </Box>
  );
}

export const CheckBoxGroup = defineComponent({
  name: "CheckBoxGroup",
  props: CheckBoxGroupSchema,
  description: "",
  component: CheckBoxGroupRenderer,
});
