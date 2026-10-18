import { z } from "zod/v4";

// ink-lang only: react-ui has no Theme component. A program declares a design
// system for a subtree: tokens as a nested object, dotted paths
// ("color.text.value") or CSS variable names ("--color-primary-500"), an
// optional stylesheet of the CSS subset, and the children it applies to.
export const ThemeSchema = z.object({
  tokens: z
    .record(z.string(), z.unknown())
    .describe(
      'Design tokens: {"color.primary": "#2563eb", "shape.fieldBorder": "round", mode: "dark", light: {...}, dark: {...}}',
    ),
  css: z
    .string()
    .nullable()
    .optional()
    .describe(
      'A stylesheet of the CSS subset, e.g. "Button:focus { background-color: var(--color-primary-700) }"',
    ),
  children: z.array(z.any()),
});
