import { z } from "zod/v4";
import { Buttons } from "../components/buttons";
import { FormControl } from "../components/form-control";

// Verbatim copy of packages/react-ui/src/genui-lib/Form/schema.ts.
export const FormSchema = z.object({
  name: z.string(),
  buttons: Buttons.ref,
  fields: z.array(FormControl.ref).default([]),
});
