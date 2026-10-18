import { z } from "zod/v4";
import { actionPropSchema } from "./action-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Button/schema.ts.
export const ButtonSchema = z.object({
  label: z.string(),
  action: actionPropSchema.optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
});
