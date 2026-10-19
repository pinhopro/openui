import { Box, Text, useInput, type DOMElement } from "ink";
import { useId, useRef, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { ORDER_LAST } from "../focus/focus-order";
import { LayerIdContext } from "../focus/modal-layer";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { Backdrop } from "../overlay/backdrop";
import { DragHandle } from "../overlay/drag-handle";
import { useDrag } from "../overlay/use-drag";
import { useOverlay } from "../overlay/use-overlay";
import { ModalSchema } from "../schemas/modal-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
import { useUiEvents } from "../ui-events";
import { useStateField } from "../use-state-field";
import { isPressKey } from "./button-keys";
import { DialogFocusOnShow } from "./dialog-focus-on-show";
import { DialogKeys } from "./dialog-keys";
import { DialogSurface } from "./dialog-surface";
import { displayText } from "./pad";
import { useDialogLayer } from "./use-dialog-layer";

type ModalProps = z.infer<typeof ModalSchema>;

interface CloseButtonProps {
  onClose: () => void;
}

/**
 * The focusable `[ x ]` in the title line, the last stop of the modal; Enter,
 * Space or a click close it (Escape is the navigator's: it cancels the layer).
 */
function CloseButton({ onClose }: CloseButtonProps) {
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: "close",
    order: ORDER_LAST,
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) onClose();
      },
    },
  });

  useInput(
    function handleCloseKey(input, key) {
      if (key.eventType === "release") return;
      if (isPressKey(input, key)) onClose();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  return (
    <Box ref={focusable.ref}>
      <Text {...(focusable.isFocused ? textProps(theme.focusRing) : {})}>[ x ]</Text>
    </Box>
  );
}

const NO_TEXT_STYLE = textProps({});

/** The width of each size, in cells; `md` when none is given, as in the React library. */
const WIDTHS: Record<string, number> = { sm: 40, md: 60, lg: 80 };

/**
 * A dialog with an accent border, the title with a close button and the
 * children, as wide as its `size` (narrower in narrow bounds), floating
 * centred over the page above a see-through backdrop (two overlays opened
 * from here, so the page keeps its layout). It shows while
 * the `$open` binding is true, as the only active layer, and focus moves to
 * its first stop once it shows. `[ x ]`, Escape and a click on the backdrop
 * cancel it: the binding becomes false, like the React library, and `cancel`
 * is reported. It moves by its title row (a mouse drag) and with Ctrl+arrows
 * while one of its stops has focus (`useDrag`), clamped into the screen.
 */
function ModalRenderer({ props, renderNode }: ComponentRenderProps<ModalProps>) {
  const theme = useTheme();
  const emit = useUiEvents();
  const isStreaming = useIsStreaming();
  const field = useStateField<unknown>("open", props.open);
  const isOpen = field.value === true || field.value === "true";
  const setValue = field.setValue;
  const layerId = useId();
  const anchorRef = useRef<DOMElement | null>(null);
  const titleRef = useRef<DOMElement | null>(null);
  const title = displayText(props.title);

  /** A dropped modal keeps its offset from the centre. */
  function stayWhereDropped(): void {}

  const drag = useDrag({
    enabled: isOpen && !isStreaming,
    name: title,
    component: "Modal",
    onDrop: stayWhereDropped,
  });

  function runCancel(): void {
    setValue(false);
    emit({ type: "cancel", component: "Modal", name: title });
  }

  const cancel = useDialogLayer({
    isOpen,
    modal: true,
    closesOnCancel: true,
    onCancel: runCancel,
    layerId,
    overlayId: layerId,
    component: "Modal",
    title,
  }).cancel;

  // Rendered here, so the children keep this element's sequence path and contexts.
  const children = isOpen ? renderNode(props.children) : null;

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
        <DialogKeys onMove={drag.moveBy} />
        <DragHandle handleRef={titleRef} handlers={drag.handlers} />
        <DialogSurface
          width={WIDTHS[props.size ?? "md"]}
          maxWidth={undefined}
          borderStyle="round"
          borderColor={theme.accent}
          background={undefined}
          paddingX={1}
          paddingY={undefined}
          mark={null}
          markColor={undefined}
          title={title}
          titleText={{ ...NO_TEXT_STYLE, bold: true }}
          titleRef={titleRef}
          dragging={drag.isDragging}
          titleAction={<CloseButton onClose={cancel} />}
          body={null}
          bodyText={NO_TEXT_STYLE}
          buttons={null}
        >
          {children}
        </DialogSurface>
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
    layer: layerId,
  });
  useOverlay({
    id: layerId,
    kind: "modal",
    anchorRef,
    placement: "center",
    isOpen,
    render: renderDialog,
    layer: layerId,
    offset: drag.offset,
    onPlaced: drag.onPlaced,
  });

  // The overlays are placed in the bounds, not against this box: it only
  // marks the declaration, out of the flow, so a gap around it never shows.
  return <Box ref={anchorRef} position="absolute" />;
}

export const Modal = defineComponent({
  name: "Modal",
  props: ModalSchema,
  description:
    "Modal dialog. open is a reactive $boolean binding — set to true to open, X/Escape/backdrop auto-closes. Put Form with buttons inside children.",
  component: ModalRenderer,
});
