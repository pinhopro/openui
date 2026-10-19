import type { Key } from "ink";
import { verticalStep } from "./arrow-keys";
import { applyKeyToEditor, countGraphemes, toGraphemes, type EditorState } from "./text-editing";

/** The line and column of a grapheme cursor inside multi-line text. */
export interface LinePosition {
  line: number;
  column: number;
}

/** Where the cursor sits: the index of its line and the column within that line. */
export function linePosition(value: string, cursor: number): LinePosition {
  const lines = value.split("\n");
  let remaining = cursor;
  for (let index = 0; index < lines.length; index += 1) {
    const length = countGraphemes(lines[index] ?? "");
    if (remaining <= length) return { line: index, column: remaining };
    remaining -= length + 1;
  }
  const lastIndex = lines.length - 1;
  return { line: lastIndex, column: countGraphemes(lines[lastIndex] ?? "") };
}

/** The grapheme cursor of a line and column; the column is clamped to the line. */
export function cursorAt(value: string, position: LinePosition): number {
  const lines = value.split("\n");
  let cursor = 0;
  for (let index = 0; index < position.line && index < lines.length; index += 1) {
    cursor += countGraphemes(lines[index] ?? "") + 1;
  }
  const length = countGraphemes(lines[position.line] ?? "");
  return cursor + Math.min(position.column, length);
}

function insertNewline(state: EditorState): EditorState {
  const graphemes = toGraphemes(state.value);
  const cursor = Math.min(Math.max(0, state.cursor), graphemes.length);
  const head = graphemes.slice(0, cursor);
  const tail = graphemes.slice(cursor);
  return { value: head.join("") + "\n" + tail.join(""), cursor: cursor + 1 };
}

function moveLine(state: EditorState, delta: number): EditorState {
  const position = linePosition(state.value, state.cursor);
  const lineCount = state.value.split("\n").length;
  const line = Math.min(Math.max(0, position.line + delta), lineCount - 1);
  if (line === position.line) return state;
  return { value: state.value, cursor: cursorAt(state.value, { line, column: position.column }) };
}

/**
 * The single-line editor plus Enter (a newline at the cursor) and Up / Down
 * (the same column on the previous / next line). An Up or Down with Ctrl,
 * Meta, Super or Hyper held is foreign (`verticalStep`): it moves a dialog
 * the editor sits in, never the cursor. Pasted text arrives as one chunk:
 * its line breaks become newlines too.
 */
export function applyKeyToMultilineEditor(
  state: EditorState,
  input: string,
  key: Key,
): EditorState {
  if (key.eventType === "release") return state;
  if (key.return) return insertNewline(state);
  const step = verticalStep(key);
  if (step !== 0) return moveLine(state, step);
  if (key.upArrow || key.downArrow) return state;
  const parts = input.split(/\r\n|\r|\n/);
  if (parts.length === 1) return applyKeyToEditor(state, input, key);
  let next = state;
  for (let index = 0; index < parts.length; index += 1) {
    if (index > 0) next = insertNewline(next);
    const part = parts[index] ?? "";
    if (part !== "") next = applyKeyToEditor(next, part, key);
  }
  return next;
}
