import { useCallback, useMemo, useRef, useState } from "react";
import type { ModalLayers } from "./modal-layer";

/** One open layer: its id and what cancelling it runs. */
interface OpenLayer {
  id: string;
  onCancel: () => void;
}

/** The id of the innermost layer of `stack`, or null when it is empty. */
function topId(stack: OpenLayer[]): string | null {
  const top = stack[stack.length - 1];
  return top === undefined ? null : top.id;
}

/**
 * A modal layer stack: `FocusScope` keeps one for the whole app, so the
 * host's own stops go inert while a program's modal is open, and an
 * `InkRenderer` keeps its own only when no scope is above it. The stack lives
 * in a ref, changed at once by `open` and the returned close, so a key read
 * before React re-renders (several keys in one stdin chunk) already cancels
 * the right layer; the active id is state, so the stops re-render.
 */
export function useModalLayers(): ModalLayers {
  const stackRef = useRef<OpenLayer[]>([]);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const openLayer = useCallback(function openLayer(id: string, onCancel: () => void) {
    const layer: OpenLayer = { id, onCancel };
    stackRef.current = stackRef.current.concat(layer);
    setActiveLayer(topId(stackRef.current));
    return function closeLayer() {
      stackRef.current = stackRef.current.filter(function keep(open) {
        return open !== layer;
      });
      setActiveLayer(topId(stackRef.current));
    };
  }, []);
  const cancelActive = useCallback(function cancelActive(): boolean {
    const top = stackRef.current[stackRef.current.length - 1];
    if (top === undefined) return false;
    top.onCancel();
    return true;
  }, []);
  return useMemo<ModalLayers>(
    function buildLayers() {
      return { activeLayer, open: openLayer, cancelActive };
    },
    [activeLayer, openLayer, cancelActive],
  );
}
