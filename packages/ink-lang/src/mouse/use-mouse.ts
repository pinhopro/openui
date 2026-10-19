import type { DOMElement } from "ink";
import { useContext, useEffect, useRef, type RefObject } from "react";
import { useLayerIsActive } from "../focus/modal-layer";
import { useOverlayVisible } from "../overlay/overlay-content-context";
import { MouseLayerContext } from "./mouse-layer";
import { MouseContext } from "./mouse-provider";
import type { MouseHandlers, MouseTarget } from "./mouse-target";

/**
 * Makes the Box behind `ref` a mouse target while mounted. Handlers are read
 * at dispatch time, so passing new closures on every render is fine. Without
 * a MouseProvider above (InkRenderer without `mouse`) this does nothing.
 */
export function useMouse(ref: RefObject<DOMElement | null>, handlers: MouseHandlers): void {
  const registry = useContext(MouseContext);
  // While a modal is open above it, or while it renders in an overlay form drawn only to be
  // measured (hidden below the root), a box takes no events (they fall through to its ancestors).
  const layerActive = useLayerIsActive();
  const visible = useOverlayVisible();
  const layer = useContext(MouseLayerContext);
  const targetRef = useRef<MouseTarget>({ ref, handlers, layer });
  targetRef.current.ref = ref;
  targetRef.current.layer = layer;
  targetRef.current.handlers = layerActive && visible ? handlers : {};

  useEffect(
    function registerTarget() {
      if (registry === null) return undefined;
      return registry.register(targetRef.current);
    },
    [registry],
  );
}
