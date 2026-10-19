import { Box, type DOMElement } from "ink";
import { useRef } from "react";
import { useMouse } from "../mouse/use-mouse";

export interface BackdropProps {
  /** Called on a click on any of the backdrop's cells. */
  onCancel: () => void;
}

/**
 * The content of a backdrop overlay (kind `backdrop`, placement `cover`, not
 * opaque), registered just under a modal: an empty box that grows over the
 * whole cover box, so the base still shows through it, and whose click calls
 * `onCancel`. It is a mouse target inside its overlay's content, deeper than
 * the overlay's shield in the same layer, so it takes the click first; the
 * shield still takes the press and release, so nothing under the backdrop
 * gets them. The modal above it is a higher layer and keeps its own cells.
 */
export function Backdrop({ onCancel }: BackdropProps) {
  const ref = useRef<DOMElement | null>(null);
  useMouse(ref, { onClick: onCancel });
  return <Box ref={ref} flexGrow={1} />;
}
