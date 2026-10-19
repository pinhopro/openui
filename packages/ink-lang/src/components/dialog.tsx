import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { DialogSchema } from "../schemas/dialog-schema";
import { DialogRenderer } from "./dialog-renderer";

type DialogProps = z.infer<typeof DialogSchema>;

/**
 * ModalDialog's non-modal sibling: it floats at its placement (under its
 * declaration by default) with no backdrop, its stops sit in the page's Tab
 * cycle where it is declared, and the page stays interactive (see
 * `DialogRenderer`).
 */
function DialogComponentRenderer({ props }: ComponentRenderProps<DialogProps>) {
  return (
    <DialogRenderer
      props={props}
      modal={false}
      placement={props.placement ?? "bottom"}
      component="Dialog"
    />
  );
}

export const Dialog = defineComponent({
  name: "Dialog",
  props: DialogSchema,
  description:
    'A dialog that floats beside the place it is declared without blocking the page: a variant mark ("info" | "success" | "warning" | "destructive" | "neutral"), a title, a body and up to two buttons, at a placement ("bottom" by default). Give it a $open binding to show and hide it; the confirm button fires confirmAction or sends its label to the assistant.',
  component: DialogComponentRenderer,
});
