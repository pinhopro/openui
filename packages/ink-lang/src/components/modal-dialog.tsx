import type { ActionPlan } from "@openuidev/lang-core";
import { Box, type DOMElement } from "ink";
import { useId, useRef, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useTriggerAction } from "../context";
import { useComponentStyle } from "../design/design-system-context";
import { LayerIdContext } from "../focus/modal-layer";
import { useFormName } from "../form-name-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { Backdrop } from "../overlay/backdrop";
import { useOverlay } from "../overlay/use-overlay";
import { ModalDialogSchema } from "../schemas/modal-dialog-schema";
import { useTheme } from "../theme";
import { boxProps, textProps } from "../theme-styles";
import { useUiEvents } from "../ui-events";
import { useStateField } from "../use-state-field";
import { DialogButton } from "./dialog-button";
import { DialogFocusOnShow } from "./dialog-focus-on-show";
import { DialogSurface } from "./dialog-surface";
import { displayText } from "./pad";
import { useDialogLayer } from "./use-dialog-layer";
import { variantColor } from "./variant-color";

type ModalDialogProps = z.infer<typeof ModalDialogSchema>;

/** The widest a ModalDialog grows: a longer body wraps. */
const DIALOG_MAX_WIDTH = 60;

const MARKS: Record<string, string> = {
  info: "ⓘ",
  success: "✓",
  warning: "!",
  destructive: "⚠",
  neutral: "•",
};

/**
 * A dialog with a variant mark, a title, a body and up to two buttons,
 * floating centred over the page above a see-through backdrop: two overlays
 * opened from here, so the page keeps its layout. While shown it is the only
 * active layer: nothing outside it takes focus or the mouse, and focus moves
 * to its first button once it shows. Cancel (its cancel button, Escape, a
 * click on the backdrop) sets `$open` to false, runs `cancelAction` and
 * reports `cancel`; confirm fires its action (or sends the label to the
 * assistant) and closes it. Without an `open` binding it is always shown and
 * its buttons only fire.
 */
function ModalDialogRenderer({ props }: ComponentRenderProps<ModalDialogProps>) {
  const theme = useTheme();
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const emit = useUiEvents();
  const field = useStateField<unknown>("open", props.open);
  const hasBinding = props.open !== undefined && props.open !== null;
  const isOpen = !hasBinding || field.value === true || field.value === "true";
  const setValue = field.setValue;
  const layerId = useId();
  const anchorRef = useRef<DOMElement | null>(null);
  const variant = props.variant;
  const title = displayText(props.title);
  const color = variant === "destructive" ? theme.danger : variantColor(variant, theme);
  const dialogStyle = useComponentStyle([variant]);
  const titleStyle = useComponentStyle([variant, "title"]);
  const bodyStyle = useComponentStyle([variant, "body"]);

  function close(): void {
    if (hasBinding) setValue(false);
  }

  function cancel(): void {
    const action = props.cancelAction as unknown as ActionPlan | null | undefined;
    if (action !== undefined && action !== null) {
      void triggerAction(displayText(props.cancelLabel), formName, action);
    }
    close();
    emit({ type: "cancel", component: "ModalDialog", name: title });
  }

  function confirm(): void {
    void triggerAction(
      displayText(props.confirmLabel),
      formName,
      props.confirmAction as unknown as ActionPlan | null | undefined,
    );
    close();
  }

  useDialogLayer({
    isOpen,
    modal: true,
    onCancel: cancel,
    layerId,
    component: "ModalDialog",
    title,
  });

  const cancelLabel = displayText(props.cancelLabel);
  const confirmLabel = displayText(props.confirmLabel);
  const box = boxProps(dialogStyle.box);
  const titleText = { ...textProps(titleStyle.text), bold: titleStyle.text.bold ?? true };
  const bodyText = textProps(bodyStyle.text);
  const body = displayText(props.body);
  const buttons =
    cancelLabel === "" && confirmLabel === "" ? null : (
      <>
        {cancelLabel === "" ? null : (
          <DialogButton
            label={cancelLabel}
            classes={[variant, "cancel"]}
            color={undefined}
            order={0}
            onPress={cancel}
          />
        )}
        {confirmLabel === "" ? null : (
          <DialogButton
            label={confirmLabel}
            classes={[variant, "confirm"]}
            color={color}
            order={1}
            onPress={confirm}
          />
        )}
      </>
    );

  // Both render functions call no hooks: they close over what the body computed.
  function renderBackdrop(): ReactNode {
    return (
      <LayerIdContext.Provider value={layerId}>
        <Backdrop onCancel={cancel} />
      </LayerIdContext.Provider>
    );
  }

  function renderDialog(): ReactNode {
    return (
      <LayerIdContext.Provider value={layerId}>
        <DialogFocusOnShow />
        <DialogSurface
          width={undefined}
          maxWidth={DIALOG_MAX_WIDTH}
          borderStyle={box.borderStyle ?? "round"}
          borderColor={box.borderColor ?? color}
          background={box.backgroundColor}
          paddingX={box.paddingX ?? 1}
          paddingY={box.paddingY}
          mark={MARKS[variant] ?? MARKS["neutral"] ?? null}
          markColor={color}
          title={title}
          titleText={titleText}
          titleAction={null}
          body={body}
          bodyText={bodyText}
          buttons={buttons}
        />
      </LayerIdContext.Provider>
    );
  }

  useOverlay({
    kind: "backdrop",
    anchorRef,
    placement: "cover",
    opaque: false,
    isOpen,
    render: renderBackdrop,
  });
  useOverlay({ kind: "modal", anchorRef, placement: "center", isOpen, render: renderDialog });

  // The overlays are placed in the bounds, not against this box: it only
  // marks the declaration, out of the flow, so a gap around it never shows.
  return <Box ref={anchorRef} position="absolute" />;
}

export const ModalDialog = defineComponent({
  name: "ModalDialog",
  props: ModalDialogSchema,
  description:
    'A dialog that blocks everything behind it: a variant mark ("info" | "success" | "warning" | "destructive" | "neutral"), a title, a body and up to two buttons. Give it a $open binding to show and hide it; the confirm button fires confirmAction or sends its label to the assistant.',
  component: ModalDialogRenderer,
});
