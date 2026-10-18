import { z } from "zod/v4";
import { Icon } from "../components/icon";
import { actionPropSchema } from "./action-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/IconButton/schema.ts.
export const IconButtonSchema = z.object({
  name: z.string(),
  icon: Icon.ref,
  action: actionPropSchema.optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
  shape: z.enum(["square", "circle"]).optional(),
});
