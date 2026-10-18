import { z } from "zod/v4";
import { reactive } from "../reactive";
import { rulesSchema } from "./rules-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Input/schema.ts.
export const InputSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  type: z.enum(["text", "email", "password", "number", "url"]).optional(),
  rules: rulesSchema,
  value: reactive(z.string().optional()),
});
