import { Box, Text } from "ink";
import type { z } from "zod/v4";
import { useComponentStyle } from "../design/design-system-context";
import { transformText } from "../design/layout-props";
import { isElementValue } from "../element-node";
import { useFormValidation } from "../form-validation-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { FormControlSchema } from "../schemas/form-control-schema";
import { textProps } from "../theme-styles";

type FormControlProps = z.infer<typeof FormControlSchema>;

interface InputFacts {
  fieldName: string | undefined;
  isRequired: boolean;
}

/** The field name and required flag of the input element this control wraps. */
function readInputFacts(input: unknown): InputFacts {
  if (!isElementValue(input)) return { fieldName: undefined, isRequired: false };
  const name = input.props["name"];
  const rules = input.props["rules"];
  let isRequired = false;
  if (typeof rules === "object" && rules !== null) {
    isRequired = (rules as Record<string, unknown>)["required"] === true;
  }
  return { fieldName: typeof name === "string" ? name : undefined, isRequired };
}

/** A label, the input and a hint or the validation error; `.label`, `.helper` and `.error` in the stylesheet. */
function FormControlRenderer({ props, renderNode }: ComponentRenderProps<FormControlProps>) {
  const formValidation = useFormValidation();
  const labelStyle = useComponentStyle(["label"]);
  const helperStyle = useComponentStyle(["helper"]);
  const errorStyle = useComponentStyle(["error"]);
  const label = props.label === null || props.label === undefined ? "" : String(props.label);
  const facts = readInputFacts(props.input);
  const error = facts.fieldName === undefined ? undefined : formValidation?.errors[facts.fieldName];
  const hasHint = props.hint !== undefined && props.hint !== null;
  return (
    <Box flexDirection="column">
      <Text {...textProps(labelStyle.text)}>
        {transformText(label, labelStyle.transform)}
        {facts.isRequired ? " *" : ""}
      </Text>
      {renderNode(props.input)}
      {error !== undefined ? (
        <Text {...textProps(errorStyle.text)}>{error}</Text>
      ) : hasHint ? (
        <Text {...textProps(helperStyle.text)}>
          {transformText(String(props.hint), helperStyle.transform)}
        </Text>
      ) : null}
    </Box>
  );
}

export const FormControl = defineComponent({
  name: "FormControl",
  props: FormControlSchema,
  description: "Field with label, input component, and optional hint text",
  component: FormControlRenderer,
});
