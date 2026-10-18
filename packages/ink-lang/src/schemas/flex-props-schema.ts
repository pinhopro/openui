import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Stack/schema.ts (FlexPropsSchema).
// Keep identical: test/schema-parity.test.ts compares it with the React default library.
export const FlexPropsSchema = z.object({
  direction: z.enum(["row", "column"]).optional(),
  gap: z.enum(["none", "xs", "s", "m", "l", "xl", "2xl"]).optional(),
  align: z.enum(["start", "center", "end", "stretch", "baseline"]).optional(),
  justify: z.enum(["start", "center", "end", "between", "around", "evenly"]).optional(),
  wrap: z.boolean().optional(),
});
