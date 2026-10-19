import { z } from "zod/v4";
import { reactive } from "../reactive";

// ink-lang only: react-ui has no Dialog component. ModalDialog's slots and
// props, non-modal: it floats beside its declaration and the page behind it
// stays interactive, at an optional placement.
export const DialogSchema = z.object({
  variant: z.enum(["info", "success", "warning", "destructive", "neutral"]),
  title: z.string(),
  body: z.string(),
  cancelLabel: z
    .string()
    .nullable()
    .optional()
    .describe("The secondary button; no button when null"),
  confirmLabel: z
    .string()
    .nullable()
    .optional()
    .describe("The primary button; no button when null"),
  // The reactive mark is identity-based, so it goes on the final schema object.
  open: reactive(
    z
      .boolean()
      .nullable()
      .optional()
      .describe(
        "A $boolean binding; the dialog shows while true and sets it to false when a button closes it",
      ),
  ),
  confirmAction: z
    .any()
    .optional()
    .describe(
      "The action of the primary button; without it the button sends its label to the assistant",
    ),
  cancelAction: z
    .any()
    .optional()
    .describe("The action of the secondary button; without it the button only closes the dialog"),
  placement: z
    .enum(["top", "bottom", "left", "right", "center"])
    .optional()
    .describe(
      'Where it floats against the place it is declared: "bottom" (default) under it, "top" over it, "left" or "right" beside it on that row, "center" centred on the screen',
    ),
});
