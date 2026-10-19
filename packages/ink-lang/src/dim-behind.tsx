import type { DOMElement } from "ink";
import { createElement, type ReactNode, type Ref } from "react";

/** SGR "faint" on, and "normal intensity" (which ends it, and bold). */
const DIM_ON = "\u001b[2m";
const DIM_OFF = "\u001b[22m";
/** SGR "bold" on, as chalk writes it for Ink's `bold`. */
const BOLD_ON = "\u001b[1m";

/**
 * One output line of the dimmed content, drawn faint. SGR 22 ends bold and
 * faint alike, so the faint style is switched on again after every 22 inside
 * the line (the end of a bold or `dimColor` run). Bold is dropped inside a
 * dimmed line: Ink re-serializes the styled cells (`@alcalzone/ansi-tokenize`),
 * and from a bold and faint cell to a faint one it writes only 22, which a
 * terminal reads as the end of faint too, so the text after a bold run would
 * lose the dim. A full reset (`\u001b[0m`) inside the line would still end
 * the faint style for the rest of it; nothing in the library writes one.
 */
export function dimLine(line: string): string {
  const faint = line.replaceAll(BOLD_ON, "").replaceAll(DIM_OFF, DIM_OFF + DIM_ON);
  return DIM_ON + faint + DIM_OFF;
}

export interface DimBehindProps {
  /** Draw the content faint: a modal is open above it. */
  active: boolean;
  children: ReactNode;
  /** The box's element (the renderer measures its page's content with it). */
  ref?: Ref<DOMElement>;
}

/**
 * The style of the box: a column sized by its content, as `<Box
 * flexDirection="column">` is, so wrapping a panel's content changes no layout.
 */
const STYLE = { flexDirection: "column", flexGrow: 0, flexShrink: 1 } as const;

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
 * transformers, so they keep their colors.
 *
 * It is always the same raw element, the transform switched on and off, so
 * toggling never remounts the page: its state and focus ids survive a modal.
 */
export function DimBehind({ active, children, ref }: DimBehindProps) {
  return createElement(
    "ink-box",
    { ref, style: STYLE, internal_transform: active ? dimLine : undefined },
    children,
  );
}
