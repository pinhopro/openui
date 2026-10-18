import { z } from "zod/v4";

// Verbatim copy of iconPropsSchema in packages/react-ui/src/components/_shared/icons/schema.ts
// (re-exported as IconSchema by packages/react-ui/src/genui-lib/Icon/schema.ts).
export const IconSchema = z.object({
  name: z
    .string()
    .describe("lucide-react icon name in kebab-case (e.g. 'circle-check', 'rocket')."),
  category: z
    .string()
    .optional()
    .describe(
      "Optional icon category (e.g. 'finance', 'charts', 'security', 'travel', 'people', 'time') used to pick a topical fallback icon when `name` doesn't resolve.",
    ),
});
