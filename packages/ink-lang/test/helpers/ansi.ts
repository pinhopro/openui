import { stripVTControlCharacters } from "node:util";

export const INVERSE_ON = "\u001b[7m";
export const BOLD_ON = "\u001b[1m";
export const DIM_ON = "\u001b[2m";
export const UNDERLINE_ON = "\u001b[4m";
export const RED_ON = "\u001b[31m";

/** The frame without any escape sequences. */
export function stripAnsi(text: string): string {
  return stripVTControlCharacters(text);
}

/** The plain text of every inverse (focused) segment in the frame. */
export function inverseSegments(frame: string): string[] {
  const segments: string[] = [];
  const pattern = /\u001b\[7m([\s\S]*?)\u001b\[27m/g;
  let match = pattern.exec(frame);
  while (match !== null) {
    segments.push(stripAnsi(match[1] ?? ""));
    match = pattern.exec(frame);
  }
  return segments;
}
