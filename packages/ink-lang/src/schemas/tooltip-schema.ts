import { z } from "zod/v4";

// ink-lang only: react-ui has no Tooltip component.
export const TooltipSchema = z.object({
  trigger: z.any().describe("The component the tooltip explains (an Icon, a Button, text...)"),
  text: z.string(),
  placement: z.enum(["top", "bottom", "left", "right"]).optional(),
  variant: z.enum(["dark", "light"]).optional(),
});
