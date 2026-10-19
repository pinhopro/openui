import type { DOMElement } from "ink";
import { elementRect, type CellRect } from "../focus/element-rect";

type ChildNode = DOMElement["childNodes"][number];

// yoga-layout's `Edge` values (yoga-layout is Ink's dependency, not this package's).
const EDGE_LEFT = 0;
const EDGE_TOP = 1;
const EDGE_RIGHT = 2;
const EDGE_BOTTOM = 3;

/**
 * True for a box laid out of the flow that takes no cells: it only marks
 * where a component was declared (a Dialog's anchor). Yoga puts such a box at
 * its parent's content start, not where it was declared, so the declaration
 * is found from its siblings (`declarationLine`).
 */
export function marksDeclaration(element: DOMElement): boolean {
  if (element.style.position !== "absolute") return false;
  const rect = elementRect(element);
  return rect.width === 0 && rect.height === 0;
}

/** True for a child the parent lays out in its flow: a box or text that is not absolute or hidden. */
function isInFlow(node: ChildNode): node is DOMElement {
  if (node.nodeName === "#text" || node.yogaNode === undefined) return false;
  return node.style.position !== "absolute" && node.style.display !== "none";
}

/** The last child laid out in the flow before `element` among its parent's children; null when none. */
function previousInFlow(element: DOMElement, parent: DOMElement): DOMElement | null {
  let previous: DOMElement | null = null;
  for (const child of parent.childNodes) {
    if (child === element) return previous;
    if (isInFlow(child)) previous = child;
  }
  return previous;
}

/** The cells inside a box's borders and padding. */
function contentBox(box: DOMElement): CellRect {
  const rect = elementRect(box);
  const node = box.yogaNode;
  if (node === undefined) return rect;
  const left = node.getComputedBorder(EDGE_LEFT) + node.getComputedPadding(EDGE_LEFT);
  const top = node.getComputedBorder(EDGE_TOP) + node.getComputedPadding(EDGE_TOP);
  const right = node.getComputedBorder(EDGE_RIGHT) + node.getComputedPadding(EDGE_RIGHT);
  const bottom = node.getComputedBorder(EDGE_BOTTOM) + node.getComputedPadding(EDGE_BOTTOM);
  return {
    x: rect.x + left,
    y: rect.y + top,
    width: Math.max(0, rect.width - left - right),
    height: Math.max(0, rect.height - top - bottom),
  };
}

/**
 * The row a column's next child would start on after `previous` (before it
 * in a reversed column), or the content's first row (its last in a reversed
 * column) when nothing comes before.
 */
function rowAfter(previous: DOMElement | null, content: CellRect, reversed: boolean): number {
  if (previous === null) return reversed ? content.y + content.height : content.y;
  const rect = elementRect(previous);
  return reversed ? rect.y : rect.y + rect.height;
}

/** The column a row's next child would start on after `previous`; see `rowAfter`. */
function columnAfter(previous: DOMElement | null, content: CellRect, reversed: boolean): number {
  if (previous === null) return reversed ? content.x + content.width : content.x;
  const rect = elementRect(previous);
  return reversed ? rect.x : rect.x + rect.width;
}

/**
 * Where a box that marks its declaration (`marksDeclaration`) was declared,
 * as a line across its parent's content: in a column, a line no rows high
 * as wide as the content, on the row just after the child laid out before it
 * (the content's first row when none); in a row, a line no columns wide as
 * high as the content, on the column just after that child. An overlay
 * placed against it goes under, over or beside the declaration. Null when
 * the box has no parent.
 */
export function declarationLine(element: DOMElement): CellRect | null {
  const parent = element.parentNode;
  if (parent === undefined) return null;
  const content = contentBox(parent);
  const previous = previousInFlow(element, parent);
  const direction = parent.style.flexDirection ?? "row";
  if (direction === "column" || direction === "column-reverse") {
    const y = rowAfter(previous, content, direction === "column-reverse");
    return { x: content.x, y, width: content.width, height: 0 };
  }
  const x = columnAfter(previous, content, direction === "row-reverse");
  return { x, y: content.y, width: 0, height: content.height };
}
