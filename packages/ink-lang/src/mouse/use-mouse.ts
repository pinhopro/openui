import type { DOMElement } from "ink";
import { useContext, useEffect, useRef, type RefObject } from "react";
import { useLayerIsActive } from "../focus/modal-layer";
import { useOverlayVisible } from "../overlay/overlay-content-context";
import { MouseLayerContext } from "./mouse-layer";
import { MouseContext } from "./mouse-provider";
import type { MouseHandlers, MouseTarget } from "./mouse-target";

export interface UseMouseOptions {
  /**
   * The box only hides what is under it and never acts (an overlay's mouse
   * shield): it keeps taking events while a modal layer is open, since what
   * it covers is decided by the paint order (its mouse layer), not by the
   * modal layers. A modal's own box is painted outside the modal's layer
   * context, so without this the clicks on it would fall through to the
   * backdrop under it.
   */
  occluder?: boolean;
  /**
   * The box only learns whether the pointer is over it (`MouseTarget.hoverWithin`):
   * it gets enter and leave for its whole box and nothing else. Like an
   * occluder it keeps its handlers while a modal layer is open: a modal
   * above it paints over its cells, which already reads as leaving it, and
   * a leave it missed would leave it entered for good.
   */
  hoverWithin?: boolean;
}

const NO_OPTIONS: UseMouseOptions = {};

/**
 * Makes the Box behind `ref` a mouse target while mounted. Handlers are read
 * at dispatch time, so passing new closures on every render is fine. Without
 * a MouseProvider above (InkRenderer without `mouse`) this does nothing.
 */
export function useMouse(
  ref: RefObject<DOMElement | null>,
  handlers: MouseHandlers,
  options: UseMouseOptions = NO_OPTIONS,
): void {
  const registry = useContext(MouseContext);
  // While a modal is open above it, or while it renders in an overlay form drawn only to be
  // measured (hidden below the root), a box takes no events (they fall through to its ancestors).
  const layerActive =
    useLayerIsActive() || options.occluder === true || options.hoverWithin === true;
  const visible = useOverlayVisible();
  const layer = useContext(MouseLayerContext);
  const targetRef = useRef<MouseTarget>({ ref, handlers, layer });
  targetRef.current.ref = ref;
  targetRef.current.layer = layer;
  targetRef.current.hoverWithin = options.hoverWithin === true;
  targetRef.current.handlers = layerActive && visible ? handlers : {};

  useEffect(
    function registerTarget() {
      if (registry === null) return undefined;
      return registry.register(targetRef.current);
    },
    [registry],
  );
}
