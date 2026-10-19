import type { ActionPlan } from "@openuidev/lang-core";
import { Box, type DOMElement } from "ink";
import { useId, useRef, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming, useTriggerAction } from "../context";
import { useComponentStyle } from "../design/design-system-context";
import { LayerIdContext } from "../focus/modal-layer";
import { SequencePathContext } from "../focus/sequence-path";
import { useFormName } from "../form-name-context";
import { Backdrop } from "../overlay/backdrop";
import { DragHandle } from "../overlay/drag-handle";
import { OverlayAnchorContext } from "../overlay/overlay-content-context";
import type { OverlayPlacement } from "../overlay/overlay-placement";
import { useDrag, type DroppedForm } from "../overlay/use-drag";
import { useOverlay } from "../overlay/use-overlay";
import type { ModalDialogSchema } from "../schemas/modal-dialog-schema";
import { useTheme } from "../theme";
import { boxProps, textProps } from "../theme-styles";
import { useUiEvents } from "../ui-events";
import { useStateField } from "../use-state-field";
import { DialogButton } from "./dialog-button";
import { DialogFocusOnShow } from "./dialog-focus-on-show";
import { DialogKeys } from "./dialog-keys";
import { DialogSurface } from "./dialog-surface";
import { displayText } from "./pad";
import { useDialogAnchor } from "./use-dialog-anchor";
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

/** Drops before the first render are ignored (none can happen: the drag needs a placement). */
function ignoreDrop(): void {}

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
 * opener when it closes. Unless `draggable` is false it moves by its title
 * bar (a mouse drag) and with Ctrl+arrows while one of its stops has focus
 * (`useDrag`), clamped into the screen; a dropped non-modal one re-anchors
 * to the page stop behind it, without moving, and its stops then follow that
 * stop in the Tab cycle (`useDialogAnchor`). Cancel (its cancel button; for a modal one also
 * Escape and a click on the backdrop) sets `$open` to false, runs
 * `cancelAction` and reports `cancel`; confirm fires its action (or sends the
 * label to the assistant) and closes it. Without an `open` binding it is
 * always shown and its buttons only fire; while the program streams a
 * missing `open` may still be on its way, so the dialog stays closed until
 * the argument arrives or the stream ends.
 */
export function DialogRenderer({ props, modal, placement, component }: DialogRendererProps) {
  const theme = useTheme();
  const triggerAction = useTriggerAction();
  const isStreaming = useIsStreaming();
  const formName = useFormName();
  const emit = useUiEvents();
  const field = useStateField<unknown>("open", props.open);
  const hasBinding = props.open !== undefined && props.open !== null;
  // While the program streams, an `open` argument that has not arrived yet
  // looks like none: the dialog stays closed until it does (or the stream
  // ends), so it never shows for a moment before its binding closes it.
  const alwaysShown = !hasBinding && !isStreaming;
  const isOpen = alwaysShown || field.value === true || field.value === "true";
  const setValue = field.setValue;
  // The modal layer's id and the id of the overlay the dialog renders in.
  const dialogId = useId();
  const anchorRef = useRef<DOMElement | null>(null);
  const titleRef = useRef<DOMElement | null>(null);
  const variant = props.variant;
  const title = displayText(props.title);

  // The anchor needs the drag and the drag reports its drops to the anchor:
  // the drop handler is read through this ref, set once both exist.
  const dropRef = useRef<(dropped: DroppedForm | null) => void>(ignoreDrop);

  /** A dropped non-modal dialog re-anchors to the stop behind it (`useDialogAnchor`). */
  function reanchor(dropped: DroppedForm | null): void {
    dropRef.current(dropped);
  }

  const drag = useDrag({
    enabled: isOpen && !isStreaming && props.draggable !== false,
    name: title,
    component,
    onDrop: reanchor,
  });
  // A modal dialog floats centred in its own layer: it has no place in the page to re-anchor to.
  const anchor = useDialogAnchor({
    enabled: !modal,
    declarationRef: anchorRef,
    placement: modal ? "center" : placement,
    drag,
  });
  dropRef.current = anchor.drop;
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

  /**
   * The content sorts in the Tab cycle after the dialog's anchor stop, and its
   * stops report it (`OverlayAnchorContext`); both providers always render,
   * so re-anchoring never remounts the content.
   */
  function anchored(content: ReactNode): ReactNode {
    return (
      <SequencePathContext.Provider value={anchor.path}>
        <OverlayAnchorContext.Provider value={anchor.stopId}>
          {content}
        </OverlayAnchorContext.Provider>
      </SequencePathContext.Provider>
    );
  }

  function renderDialog(): ReactNode {
    return inLayer(
      anchored(
        <>
          <DialogFocusOnShow />
          <DialogKeys onMove={drag.moveBy} />
          <DragHandle handleRef={titleRef} handlers={drag.handlers} />
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
            titleRef={titleRef}
            dragging={drag.isDragging}
            titleAction={null}
            body={body}
            bodyText={bodyText}
            buttons={buttons}
          />
        </>,
      ),
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
  // A non-modal one is placed against its anchor (`useDialogAnchor`).
  useOverlay({
    id: dialogId,
    kind: modal ? "modal" : "dialog",
    anchorRef: anchor.anchorRef,
    placement: anchor.placement,
    isOpen,
    render: renderDialog,
    layer: modal ? dialogId : undefined,
    offset: anchor.offset,
    onPlaced: anchor.onPlaced,
    // Against a stop, the page's background, never the stop's own (state-dependent) fill.
    backgroundFromParent: anchor.stopId !== null,
    // A short page keeps the rows its declaration needs: a drop never changes the page.
    reserve: { anchorRef, placement: modal ? "center" : placement },
  });

  // The overlays are placed in the bounds or against the line this box marks
  // (`declarationLine`), not against the box itself: it is out of the flow,
  // so a gap around it never shows.
  return <Box ref={anchorRef} position="absolute" />;
}
