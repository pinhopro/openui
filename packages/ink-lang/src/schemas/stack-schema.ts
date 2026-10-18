import { z } from "zod/v4";
import { FlexPropsSchema } from "./flex-props-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Stack/schema.ts (StackSchema).
// Keep identical: test/schema-parity.test.ts compares it with the React default library.
export const StackSchema = z
  .object({
    children: z.array(z.any()),
  })
  .merge(FlexPropsSchema);
