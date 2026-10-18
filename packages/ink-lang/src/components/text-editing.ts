import type { Key } from "ink";

/** The text and cursor of a single-line editor; the cursor counts graphemes, not code units. */
export interface EditorState {
  value: string;
  cursor: number;
}

/** The value split around the cursor cell, for drawing an inverse cursor. */
export interface CursorSplit {
  before: string;
  at: string;
  after: string;
}

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Splits text into user-perceived characters so emoji and combining marks move as one. */
export function toGraphemes(value: string): string[] {
  const graphemes: string[] = [];
  for (const segment of segmenter.segment(value)) {
    graphemes.push(segment.segment);
  }
  return graphemes;
}

export function countGraphemes(value: string): number {
  return toGraphemes(value).length;
}

function clampCursor(length: number, cursor: number): number {
  if (cursor < 0) return 0;
  if (cursor > length) return length;
  return cursor;
}

/** Drops control characters so escape fragments never land in the value. */
function printableOnly(input: string): string {
  let printable = "";
  for (const character of input) {
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127) continue;
    printable += character;
  }
  return printable;
}

/** Applies one key press to the editor; keys the editor does not own leave it unchanged. */
export function applyKeyToEditor(state: EditorState, input: string, key: Key): EditorState {
  const value = state.value;
  const graphemes = toGraphemes(value);
  const cursor = clampCursor(graphemes.length, state.cursor);
  const isForeign =
    key.eventType === "release" ||
    key.return ||
    key.tab ||
    key.escape ||
    key.ctrl ||
    key.meta ||
    key.upArrow ||
    key.downArrow ||
    key.pageUp ||
    key.pageDown;
  if (isForeign) return { value, cursor };
  if (key.leftArrow) return { value, cursor: Math.max(0, cursor - 1) };
  if (key.rightArrow) return { value, cursor: Math.min(graphemes.length, cursor + 1) };
  if (key.home) return { value, cursor: 0 };
  if (key.end) return { value, cursor: graphemes.length };
  if (key.backspace) {
    if (cursor === 0) return { value, cursor };
    const head = graphemes.slice(0, cursor - 1);
    const tail = graphemes.slice(cursor);
    return { value: head.join("") + tail.join(""), cursor: cursor - 1 };
  }
  if (key.delete) {
    const head = graphemes.slice(0, cursor);
    const tail = graphemes.slice(cursor + 1);
    return { value: head.join("") + tail.join(""), cursor };
  }
  const printable = printableOnly(input);
  if (printable === "") return { value, cursor };
  const head = graphemes.slice(0, cursor);
  const tail = graphemes.slice(cursor);
  const inserted = countGraphemes(printable);
  return { value: head.join("") + printable + tail.join(""), cursor: cursor + inserted };
}

/** Splits the value at the cursor; past the end the cursor sits on a space. */
export function splitForCursor(value: string, cursor: number): CursorSplit {
  const graphemes = toGraphemes(value);
  const position = clampCursor(graphemes.length, cursor);
  const before = graphemes.slice(0, position);
  const at = position < graphemes.length ? (graphemes[position] ?? " ") : " ";
  const after = position < graphemes.length ? graphemes.slice(position + 1) : [];
  return { before: before.join(""), at, after: after.join("") };
}

/** Replaces every user-perceived character with the mask character (password fields). */
export function maskValue(value: string, mask: string): string {
  return mask.repeat(countGraphemes(value));
}
