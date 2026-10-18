import { z } from "zod/v4";
import { reactive } from "../reactive";
import { rulesSchema } from "./rules-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/DatePicker/schema.ts.
export const DatePickerSchema = z.object({
  name: z.string(),
  mode: z.enum(["single", "range"]).optional(),
  rules: rulesSchema,
  value: reactive(z.unknown().optional()),
});
