import type { DOMElement } from "ink";

/**
 * The background colour `element`'s cells are painted with: its own
 * `backgroundColor`, else the nearest ancestor's (reached through
 * `parentNode`), as Ink's boxes inherit it; null when none sets one. The
 * overlay host paints an overlay with its anchor's background, since the host
 * renders elsewhere in the tree and Ink's inherited background (a context of
 * its own) does not reach it.
 */
export function anchorBackground(element: DOMElement): string | null {
  let current: DOMElement | undefined = element;
  while (current !== undefined) {
    const color: unknown = current.style.backgroundColor;
    if (typeof color === "string" && color !== "") return color;
    current = current.parentNode;
  }
  return null;
}
