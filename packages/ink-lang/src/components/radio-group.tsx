import type { ElementNode } from "@openuidev/lang-core";
import { Box } from "ink";
import { useRef, type ReactNode } from "react";
import type { z } from "zod/v4";
import { isElementValue } from "../element-node";
import { defineComponent, type ComponentRenderProps } from "../library";
import { RadioGroupSchema } from "../schemas/radio-group-schema";
import { useFieldValidation } from "../use-field-validation";
import { useStateField } from "../use-state-field";
import { OptionLine } from "./option-line";
import { displayText } from "./pad";
import { useOptionGroup } from "./use-option-group";

type RadioGroupProps = z.infer<typeof RadioGroupSchema>;

const SELECTED_MARK = "(•)";
const UNSELECTED_MARK = "( )";

interface RadioOption {
  value: string;
  label: string;
  description: string;
}

/** The RadioItem elements of the group; anything else the model wrote is skipped. */
function radioOptions(items: unknown): RadioOption[] {
  const result: RadioOption[] = [];
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    if (!isElementValue(item)) continue;
    const element = item as ElementNode;
    result.push({
      value: displayText(element.props["value"]),
      label: displayText(element.props["label"]),
      description: displayText(element.props["description"]),
    });
  }
  return result;
}

/** One focus stop: Up and Down move, Space or Enter picks the option under the cursor. */
function RadioGroupRenderer({ props }: ComponentRenderProps<RadioGroupProps>) {
  const field = useStateField<unknown>(props.name, props.value);
  const options = radioOptions(props.items);
  const selected = field.value === undefined ? props.defaultValue : field.value;
  const storedRef = useRef(field.value);
  storedRef.current = field.value;

  const group = useOptionGroup({
    count: options.length,
    onPress: function pick(index) {
      const option = options[index];
      if (option === undefined) return;
      storedRef.current = option.value;
      field.setValue(option.value);
      validation.validate(option.value);
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

  if (options.length === 0) return null;
  const lines: ReactNode[] = [];
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index] as RadioOption;
    lines.push(
      <OptionLine
        key={index}
        mark={option.value === selected ? SELECTED_MARK : UNSELECTED_MARK}
        label={option.label}
        description={option.description}
        isCursor={group.isFocused && index === group.cursor}
      />,
    );
  }
  return <Box flexDirection="column">{lines}</Box>;
}

export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: RadioGroupSchema,
  description: "",
  component: RadioGroupRenderer,
});
