import { Box } from "ink";
import type { z } from "zod/v4";
import { FormNameContext } from "../form-name-context";
import { FormValidationContext, useCreateFormValidation } from "../form-validation-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { FormSchema } from "../schemas/form-schema";

type FormProps = z.infer<typeof FormSchema>;

/** Scopes its fields under the form name and owns their validation state. */
function FormRenderer({ props, renderNode }: ComponentRenderProps<FormProps>) {
  const formValidation = useCreateFormValidation();
  return (
    <FormValidationContext.Provider value={formValidation}>
      <FormNameContext.Provider value={props.name}>
        <Box flexDirection="column" gap={1}>
          {renderNode(props.fields)}
          {renderNode(props.buttons)}
        </Box>
      </FormNameContext.Provider>
    </FormValidationContext.Provider>
  );
}

export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description: "Form container with fields and explicit action buttons",
  component: FormRenderer,
});
