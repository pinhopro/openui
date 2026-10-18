import { Box, Text } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { FormControlSchema } from "../schemas/form-control-schema";

type FormControlProps = z.infer<typeof FormControlSchema>;

function FormControlRenderer({ props, renderNode }: ComponentRenderProps<FormControlProps>) {
  const label = props.label === null || props.label === undefined ? "" : String(props.label);
  const hasHint = props.hint !== undefined && props.hint !== null;
  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      {renderNode(props.input)}
      {hasHint ? <Text dimColor>{String(props.hint)}</Text> : null}
    </Box>
  );
}

export const FormControl = defineComponent({
  name: "FormControl",
  props: FormControlSchema,
  description: "Field with label, input component, and optional hint text",
  component: FormControlRenderer,
});
