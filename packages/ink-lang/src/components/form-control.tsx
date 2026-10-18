import { Box, Text } from "ink";
import type { z } from "zod/v4";
import { isElementValue } from "../element-node";
import { useFormValidation } from "../form-validation-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { FormControlSchema } from "../schemas/form-control-schema";
import { useTheme } from "../theme";
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

function FormControlRenderer({ props, renderNode }: ComponentRenderProps<FormControlProps>) {
  const formValidation = useFormValidation();
  const theme = useTheme();
  const label = props.label === null || props.label === undefined ? "" : String(props.label);
  const facts = readInputFacts(props.input);
  const error = facts.fieldName === undefined ? undefined : formValidation?.errors[facts.fieldName];
  const hasHint = props.hint !== undefined && props.hint !== null;
  return (
    <Box flexDirection="column">
      <Text bold>
        {label}
        {facts.isRequired ? " *" : ""}
      </Text>
      {renderNode(props.input)}
      {error !== undefined ? (
        <Text color={theme.danger}>{error}</Text>
      ) : hasHint ? (
        <Text {...textProps(theme.subtext)}>{String(props.hint)}</Text>
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
