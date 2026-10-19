import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ModalDialogSchema } from "../schemas/modal-dialog-schema";
import { DialogRenderer } from "./dialog-renderer";

type ModalDialogProps = z.infer<typeof ModalDialogSchema>;

/**
 * A dialog that blocks everything behind it: floating centred over the page
 * above a see-through backdrop, the only active layer while shown; Escape and
 * a click on the backdrop cancel it (see `DialogRenderer`).
 */
function ModalDialogRenderer({ props }: ComponentRenderProps<ModalDialogProps>) {
  return <DialogRenderer props={props} modal placement="center" component="ModalDialog" />;
}

export const ModalDialog = defineComponent({
  name: "ModalDialog",
  props: ModalDialogSchema,
  description:
    'A dialog that blocks everything behind it: a variant mark ("info" | "success" | "warning" | "destructive" | "neutral"), a title, a body and up to two buttons. Give it a $open binding to show and hide it; the confirm button fires confirmAction or sends its label to the assistant.',
  component: ModalDialogRenderer,
});
