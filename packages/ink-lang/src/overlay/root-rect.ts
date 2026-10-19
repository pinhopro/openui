import type { DOMElement } from "ink";
import type { CellRect } from "../focus/element-rect";

/** The ink root above `element`: the node reached through `parentNode` that has no parent. */
function inkRoot(element: DOMElement): DOMElement {
  let current = element;
  while (current.parentNode !== undefined) current = current.parentNode;
  return current;
}

/**
 * The cells Ink draws: the root's computed size at 0,0. Rows below it are not
 * output, so an overlay must stay inside this rectangle to be seen.
 */
export function rootRect(element: DOMElement): CellRect {
  const yogaNode = inkRoot(element).yogaNode;
  if (yogaNode === undefined) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: 0,
    y: 0,
    width: yogaNode.getComputedWidth(),
    height: yogaNode.getComputedHeight(),
  };
}
