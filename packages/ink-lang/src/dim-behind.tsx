import { createElement, type ReactNode } from "react";

/** SGR "faint" on, and "normal intensity" (which ends it). */
const DIM_ON = "\u001b[2m";
const DIM_OFF = "\u001b[22m";

/** One output line of the dimmed content, drawn faint. */
export function dimLine(line: string): string {
  return DIM_ON + line + DIM_OFF;
}

export interface DimBehindProps {
  /** Draw the content faint: a modal is open above it. */
  active: boolean;
  children: ReactNode;
}

/** The style of the box: a column that fills its parent, like the page box it sits in. */
const STYLE = { flexDirection: "column", flexGrow: 1, flexShrink: 1 } as const;

/**
 * A column box whose text is drawn faint while `active` (a modal is open
 * above the page), so the page reads as behind the modal.
 *
 * Ink's `Transform` only wraps text (it creates an `ink-text` with
 * `internal_transform`), so this creates the raw `ink-box` element itself with
 * `internal_transform` set to `dimLine`. This relies on Ink internals, like
 * the `contentOffsetY` the focus rectangles read: the reconciler stores the
 * `internal_transform` prop on the node, and `renderNodeToOutput` passes a
 * node's `internal_transform` down to every descendant, which applies it to
 * each line of text it writes. Borders and backgrounds are written without
 * transformers, so they keep their colors; a descendant's own SGR 22 (the end
 * of a bold run) ends the faint style for the rest of that line.
 *
 * It is always the same raw element, the transform switched on and off, so
 * toggling never remounts the page: its state and focus ids survive a modal.
 */
export function DimBehind({ active, children }: DimBehindProps) {
  return createElement(
    "ink-box",
    { style: STYLE, internal_transform: active ? dimLine : undefined },
    children,
  );
}
