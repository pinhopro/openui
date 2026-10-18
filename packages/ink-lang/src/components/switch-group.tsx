import { Box } from "ink";
import { useRef, type ReactNode } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { SwitchGroupSchema } from "../schemas/switch-group-schema";
import { useTheme } from "../theme";
import { useStateField } from "../use-state-field";
import { checkedAggregate, checkedItems, type CheckedItem } from "./checked-aggregate";
import { OptionLine } from "./option-line";
import { useOptionGroup } from "./use-option-group";

type SwitchGroupProps = z.infer<typeof SwitchGroupSchema>;

const ON_MARK = "[on ]";
const OFF_MARK = "[off]";

/**
 * Like CheckBoxGroup with on/off marks and an optional card (round) or sunk
 * (single dim) border; the stored value is the aggregate `{ itemName: boolean }`.
 */
function SwitchGroupRenderer({ props }: ComponentRenderProps<SwitchGroupProps>) {
  const theme = useTheme();
  const field = useStateField<unknown>(props.name, props.value);
  const items = checkedItems(props.items);
  const aggregate = checkedAggregate(items, field.value);
  const aggregateRef = useRef(aggregate);
  aggregateRef.current = aggregate;

  const group = useOptionGroup({
    count: items.length,
    orientation: "vertical",
    name: field.name,
    onPress: function toggle(index) {
      const item = items[index];
      if (item === undefined) return;
      const next = { ...aggregateRef.current, [item.name]: !aggregateRef.current[item.name] };
      aggregateRef.current = next;
      field.setValue(next);
    },
  });

  if (items.length === 0) return null;
  const lines: ReactNode[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] as CheckedItem;
    lines.push(
      <OptionLine
        key={item.name}
        mark={aggregate[item.name] === true ? ON_MARK : OFF_MARK}
        label={item.label}
        description={item.description}
        isCursor={group.isFocused && index === group.cursor}
        onPress={function pressThis() {
          group.pressAt(index);
        }}
      />,
    );
  }
  const borderStyle =
    props.variant === "card" ? "round" : props.variant === "sunk" ? "single" : undefined;
  return (
    <Box
      ref={group.ref}
      flexDirection="column"
      borderStyle={borderStyle}
      borderColor={props.variant === "card" ? theme.accent : undefined}
      borderDimColor={props.variant === "sunk"}
      paddingX={borderStyle === undefined ? 0 : 1}
    >
      {lines}
    </Box>
  );
}

export const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: SwitchGroupSchema,
  description: "Group of switch toggles",
  component: SwitchGroupRenderer,
});
