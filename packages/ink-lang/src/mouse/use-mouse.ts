import type { DOMElement } from "ink";
import { useContext, useEffect, useRef, type RefObject } from "react";
import { MouseContext } from "./mouse-provider";
import type { MouseHandlers, MouseTarget } from "./mouse-target";

/**
 * Makes the Box behind `ref` a mouse target while mounted. Handlers are read
 * at dispatch time, so passing new closures on every render is fine. Without
 * a MouseProvider above (InkRenderer without `mouse`) this does nothing.
 */
export function useMouse(ref: RefObject<DOMElement | null>, handlers: MouseHandlers): void {
  const registry = useContext(MouseContext);
  const targetRef = useRef<MouseTarget>({ ref, handlers });
  targetRef.current.ref = ref;
  targetRef.current.handlers = handlers;

  useEffect(
    function registerTarget() {
      if (registry === null) return undefined;
      return registry.register(targetRef.current);
    },
    [registry],
  );
}
