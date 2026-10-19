import { stripVTControlCharacters } from "node:util";

export const INVERSE_ON = "\u001b[7m";
export const BOLD_ON = "\u001b[1m";
export const DIM_ON = "\u001b[2m";
export const UNDERLINE_ON = "\u001b[4m";
export const RED_ON = "\u001b[31m";
export const CYAN_ON = "\u001b[36m";

/** The frame without any escape sequences. */
export function stripAnsi(text: string): string {
  return stripVTControlCharacters(text);
}

/**
 * True when a terminal draws the first character of `text` in `line` faint:
 * the SGR sequences before it are read in order, `2` turning faint on and
 * `22` or a reset (`0` or empty) turning it off, as a terminal does.
 */
export function isFaintAt(line: string, text: string): boolean {
  const pattern = /\u001b\[([\d;]*)m|([^\u001b])/g;
  let faint = false;
  let plain = "";
  const target = stripAnsi(line).indexOf(text);
  let match = pattern.exec(line);
  while (match !== null) {
    if (match[2] !== undefined) {
      if (plain.length === target) return faint;
      plain += match[2];
    } else {
      for (const param of (match[1] ?? "").split(";")) {
        if (param === "2") faint = true;
        if (param === "22" || param === "0" || param === "") faint = false;
      }
    }
    match = pattern.exec(line);
  }
  return false;
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
