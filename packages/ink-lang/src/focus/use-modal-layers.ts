import { useCallback, useMemo, useState } from "react";
import type { ModalLayers } from "./modal-layer";

/**
 * A modal layer stack: `FocusScope` keeps one for the whole app, so the
 * host's own stops go inert while a program's modal is open, and an
 * `InkRenderer` keeps its own only when no scope is above it.
 */
export function useModalLayers(): ModalLayers {
  const [layers, setLayers] = useState<string[]>([]);
  const openLayer = useCallback(function openLayer(id: string) {
    setLayers(function push(previous) {
      return previous.concat(id);
    });
    return function closeLayer() {
      setLayers(function drop(previous) {
        return previous.filter(function keep(layer) {
          return layer !== id;
        });
      });
    };
  }, []);
  return useMemo<ModalLayers>(
    function buildLayers() {
      return {
        activeLayer: layers.length === 0 ? null : (layers[layers.length - 1] as string),
        open: openLayer,
      };
    },
    [layers, openLayer],
  );
}
