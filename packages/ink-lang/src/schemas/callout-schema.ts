import { z } from "zod/v4";
import { reactive } from "../reactive";

// Verbatim copy of packages/react-ui/src/genui-lib/Callout/schema.ts.
export const CalloutSchema = z.object({
  variant: z.enum(["info", "warning", "error", "success", "neutral"]),
  title: z.string(),
  description: z.string(),
  visible: reactive(z.boolean().optional()),
});
