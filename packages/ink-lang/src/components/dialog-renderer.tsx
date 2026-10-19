import type { ActionPlan } from "@openuidev/lang-core";
import { Box, type DOMElement } from "ink";
import { useId, useRef, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useTriggerAction } from "../context";
import { useComponentStyle } from "../design/design-system-context";
import { LayerIdContext } from "../focus/modal-layer";
import { useFormName } from "../form-name-context";
import { Backdrop } from "../overlay/backdrop";
import type { OverlayPlacement } from "../overlay/overlay-placement";
import { useOverlay } from "../overlay/use-overlay";
import type { ModalDialogSchema } from "../schemas/modal-dialog-schema";
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

/** The props `ModalDialog` and `Dialog` share (`Dialog` adds its placement). */
export type VariantDialogProps = z.infer<typeof ModalDialogSchema>;

export interface DialogRendererProps {
  props: VariantDialogProps;
  /**
   * It blocks everything behind it (`ModalDialog`): it floats centred over a
   * see-through backdrop and holds a modal layer. A non-modal one (`Dialog`)
   * floats at `placement` against its declaration, with no backdrop, and
   * leaves the page interactive.
   */
  modal: boolean;
  /** Where a non-modal dialog goes against its declaration; a modal one is always centred. */
  placement: OverlayPlacement;
  /** The component's name (`ModalDialog`, `Dialog`), reported in its UI events. */
  component: string;
}

/** The widest a dialog grows: a longer body wraps. */
const DIALOG_MAX_WIDTH = 60;

const MARKS: Record<string, string> = {
  info: "ⓘ",
  success: "✓",
  warning: "!",
  destructive: "⚠",
  neutral: "•",
};

/**
 * A dialog with a variant mark, a title, a body and up to two buttons, drawn
 * in an overlay opened from here, so the page keeps its layout. A modal one
 * floats centred above a see-through backdrop and, while shown, is the only
 * active layer: nothing outside it takes focus or the mouse. A non-modal one
 * floats at its placement against the line where it is declared, its stops
 * sit in the page's Tab cycle at that place, and the page stays interactive.
 * Either moves focus to its first stop once it shows and gives it back to its
 * opener when it closes. Cancel (its cancel button; for a modal one also
 * Escape and a click on the backdrop) sets `$open` to false, runs
 * `cancelAction` and reports `cancel`; confirm fires its action (or sends the
 * label to the assistant) and closes it. Without an `open` binding it is
 * always shown and its buttons only fire.
 */
export function DialogRenderer({ props, modal, placement, component }: DialogRendererProps) {
  const theme = useTheme();
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const emit = useUiEvents();
  const field = useStateField<unknown>("open", props.open);
  const hasBinding = props.open !== undefined && props.open !== null;
  const isOpen = !hasBinding || field.value === true || field.value === "true";
  const setValue = field.setValue;
  // The modal layer's id and the id of the overlay the dialog renders in.
  const dialogId = useId();
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

  function runCancel(): void {
    const action = props.cancelAction as unknown as ActionPlan | null | undefined;
    if (action !== undefined && action !== null) {
      // Without a cancel button the action is named after the dialog.
      const label = displayText(props.cancelLabel);
      void triggerAction(label === "" ? title : label, formName, action);
    }
    close();
    emit({ type: "cancel", component, name: title });
  }

  function confirm(): void {
    void triggerAction(
      displayText(props.confirmLabel),
      formName,
      props.confirmAction as unknown as ActionPlan | null | undefined,
    );
    close();
  }

  const cancel = useDialogLayer({
    isOpen,
    modal,
    closesOnCancel: hasBinding,
    onCancel: runCancel,
    layerId: dialogId,
    overlayId: dialogId,
    component,
    title,
  }).cancel;

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

  // The render functions call no hooks: they close over what the body computed.

  /**
   * A modal dialog's content belongs to its own layer; a non-modal one's
   * stays in the layer it is declared in (the bridged `LayerIdContext`).
   */
  function inLayer(content: ReactNode): ReactNode {
    if (!modal) return content;
    return <LayerIdContext.Provider value={dialogId}>{content}</LayerIdContext.Provider>;
  }

  function renderBackdrop(): ReactNode {
    return inLayer(<Backdrop onCancel={cancel} />);
  }

  function renderDialog(): ReactNode {
    return inLayer(
      <>
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
      </>,
    );
  }

  useOverlay({
    kind: "backdrop",
    anchorRef,
    placement: "cover",
    opaque: false,
    isOpen: isOpen && modal,
    render: renderBackdrop,
    layer: dialogId,
  });
  // A modal dialog is in its own layer; a non-modal one stays in the layer it is declared in.
  useOverlay({
    id: dialogId,
    kind: modal ? "modal" : "dialog",
    anchorRef,
    placement: modal ? "center" : placement,
    isOpen,
    render: renderDialog,
    layer: modal ? dialogId : undefined,
  });

  // The overlays are placed in the bounds or against the line this box marks
  // (`declarationLine`), not against the box itself: it is out of the flow,
  // so a gap around it never shows.
  return <Box ref={anchorRef} position="absolute" />;
}
