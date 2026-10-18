import { z } from "zod/v4";
import { reactive } from "../reactive";
import { rulesSchema } from "./rules-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/TextArea/schema.ts.
export const TextAreaSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  rows: z.number().optional(),
  rules: rulesSchema,
  value: reactive(z.string().optional()),
});
