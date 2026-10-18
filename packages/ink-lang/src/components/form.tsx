import { Box } from "ink";
import type { z } from "zod/v4";
import { FormNameContext } from "../form-name-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { FormSchema } from "../schemas/form-schema";

type FormProps = z.infer<typeof FormSchema>;

/** Scopes its fields under the form name; validation is not part of this pass. */
function FormRenderer({ props, renderNode }: ComponentRenderProps<FormProps>) {
  return (
    <FormNameContext.Provider value={props.name}>
      <Box flexDirection="column" gap={1}>
        {renderNode(props.fields)}
        {renderNode(props.buttons)}
      </Box>
    </FormNameContext.Provider>
  );
}

export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description: "Form container with fields and explicit action buttons",
  component: FormRenderer,
});
