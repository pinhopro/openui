import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/CardHeader/schema.ts.
export const CardHeaderSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
});
