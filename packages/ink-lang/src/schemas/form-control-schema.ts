import { z } from "zod/v4";
import { Select } from "../components/select";
import { Input } from "../components/text-input";

// Copy of packages/react-ui/src/genui-lib/FormControl/schema.ts with the input union reduced
// to the components this library ships (the one deliberate difference from react-ui).
export const FormControlSchema = z.object({
  label: z.string(),
  input: z.union([Input.ref, Select.ref]),
  hint: z.string().optional(),
});
